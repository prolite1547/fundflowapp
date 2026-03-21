package com.iamicdev.fundflowapp.util

import spock.lang.Specification
import spock.lang.Unroll

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.ZoneId

class DateRangeSpec extends Specification {

    ZoneId utc = ZoneId.of("UTC")

    // ==============================
    // FOR DAILY
    // ==============================

    def "forDaily - start is at midnight and end is 24 hours later"() {
        given:
        def date = LocalDate.of(2026, 3, 6)

        when:
        def range = DateRange.forDaily(date, utc)

        then:
        range.startInclusive().toString() == "2026-03-06T00:00:00Z"
        range.endExclusive().toString() == "2026-03-07T00:00:00Z"
    }

    def "forDaily - covers exactly 24 hours"() {
        given:
        def date = LocalDate.of(2026, 3, 6)

        when:
        def range = DateRange.forDaily(date, utc)

        then:
        def duration = range.endExclusive().epochSecond - range.startInclusive().epochSecond
        duration == 86400 // 24 * 60 * 60
    }

    @Unroll
    def "forDaily - works correctly for month boundary date #date"() {
        given:
        def ld = LocalDate.parse(date)

        when:
        def range = DateRange.forDaily(ld, utc)

        then:
        range.startInclusive() < range.endExclusive()

        where:
        date         | _
        "2026-01-01" | _
        "2026-01-31" | _
        "2026-02-28" | _
        "2026-12-31" | _
    }

    // ==============================
    // FOR WEEKLY
    // ==============================

    def "forWeekly - start is on Monday for a Wednesday input"() {
        given:
        def wednesday = LocalDate.of(2026, 3, 4) // Wednesday

        when:
        def range = DateRange.forWeekly(wednesday, utc)

        then:
        def monStart = LocalDate.ofInstant(range.startInclusive(), utc)
        monStart.dayOfWeek == DayOfWeek.MONDAY
        monStart == LocalDate.of(2026, 3, 2)
    }

    def "forWeekly - covers exactly 7 days"() {
        given:
        def date = LocalDate.of(2026, 3, 6)

        when:
        def range = DateRange.forWeekly(date, utc)

        then:
        def durationDays = (range.endExclusive().epochSecond - range.startInclusive().epochSecond) / 86400
        durationDays == 7
    }

    def "forWeekly - Monday input returns the same Monday as start"() {
        given:
        def monday = LocalDate.of(2026, 3, 2)

        when:
        def range = DateRange.forWeekly(monday, utc)

        then:
        def start = LocalDate.ofInstant(range.startInclusive(), utc)
        start == LocalDate.of(2026, 3, 2)
        start.dayOfWeek == DayOfWeek.MONDAY
    }

    def "forWeekly - Sunday input returns the preceding Monday as start"() {
        given:
        def sunday = LocalDate.of(2026, 3, 8)

        when:
        def range = DateRange.forWeekly(sunday, utc)

        then:
        def start = LocalDate.ofInstant(range.startInclusive(), utc)
        start.dayOfWeek == DayOfWeek.MONDAY
        start == LocalDate.of(2026, 3, 2)
    }

    // ==============================
    // FOR MONTHLY
    // ==============================

    def "forMonthly - starts on first day of month"() {
        when:
        def range = DateRange.forMonthly(2026, 3, utc)

        then:
        range.startInclusive().toString() == "2026-03-01T00:00:00Z"
    }

    def "forMonthly - ends on first day of next month (exclusive)"() {
        when:
        def range = DateRange.forMonthly(2026, 3, utc)

        then:
        range.endExclusive().toString() == "2026-04-01T00:00:00Z"
    }

    def "forMonthly - covers all 28 days for February in a non-leap year"() {
        when:
        def range = DateRange.forMonthly(2026, 2, utc)

        then:
        def days = (range.endExclusive().epochSecond - range.startInclusive().epochSecond) / 86400
        days == 28
    }

    def "forMonthly - covers all 29 days for February in a leap year"() {
        when:
        def range = DateRange.forMonthly(2024, 2, utc)

        then:
        def days = (range.endExclusive().epochSecond - range.startInclusive().epochSecond) / 86400
        days == 29
    }

    def "forMonthly - covers 31 days for January"() {
        when:
        def range = DateRange.forMonthly(2026, 1, utc)

        then:
        def days = (range.endExclusive().epochSecond - range.startInclusive().epochSecond) / 86400
        days == 31
    }

    def "forMonthly - covers 30 days for April"() {
        when:
        def range = DateRange.forMonthly(2026, 4, utc)

        then:
        def days = (range.endExclusive().epochSecond - range.startInclusive().epochSecond) / 86400
        days == 30
    }

    @Unroll
    def "forMonthly - month #month has #expectedDays days"() {
        when:
        def range = DateRange.forMonthly(2026, month, utc)

        then:
        def days = (range.endExclusive().epochSecond - range.startInclusive().epochSecond) / 86400
        days == expectedDays

        where:
        month | expectedDays
        1     | 31
        2     | 28
        3     | 31
        4     | 30
        5     | 31
        6     | 30
        7     | 31
        8     | 31
        9     | 30
        10    | 31
        11    | 30
        12    | 31
    }

    def "forYearly - covers entire year from Jan 1st to next year's Jan 1st"() {
        when:
        def range = DateRange.forYearly(2026, utc)

        then:
        range.startInclusive().toString() == "2026-01-01T00:00:00Z"
        range.endExclusive().toString() == "2027-01-01T00:00:00Z"
    }

    def "forRange - covers specific dates from start midnight to day after end midnight"() {
        given:
        def start = LocalDate.of(2026, 3, 1)
        def end = LocalDate.of(2026, 3, 15)

        when:
        def range = DateRange.forRange(start, end, utc)

        then:
        range.startInclusive().toString() == "2026-03-01T00:00:00Z"
        range.endExclusive().toString() == "2026-03-16T00:00:00Z"
    }

    def "start is before end for every month"() {
        expect:
        (1..12).every { month ->
            def range = DateRange.forMonthly(2026, month, utc)
            range.startInclusive() < range.endExclusive()
        }
    }
}
