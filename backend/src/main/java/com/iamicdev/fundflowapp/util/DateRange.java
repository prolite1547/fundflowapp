package com.iamicdev.fundflowapp.util;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;

public class DateRange{

    public record InstantRange(Instant startInclusive, Instant endExclusive){}

    public static InstantRange forDaily(LocalDate date, ZoneId zone){
        return new InstantRange(
            date.atStartOfDay(zone).toInstant(),
            date.atStartOfDay(zone).plusDays(1).toInstant()
        );
    }

    public static InstantRange forWeekly(LocalDate anyDayOfTheWeek, ZoneId zone){
        WeekFields weekFields = WeekFields.of(DayOfWeek.MONDAY, 1);
        LocalDate start = anyDayOfTheWeek.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate end = start.plusDays(7);
        return new InstantRange(
            start.atStartOfDay(zone).toInstant(),
            end.atStartOfDay(zone).toInstant()
        );
    }

    public static InstantRange forMonthly(int year, int month, ZoneId zone){
        YearMonth ym = YearMonth.of(year, month);
        Instant start = ym.atDay(1).atStartOfDay(zone).toInstant();
        Instant end = ym.atEndOfMonth().plusDays(1).atStartOfDay(zone).toInstant();
        return new InstantRange(
            start,
            end
        );
    }

    public static InstantRange forYearly(int year, ZoneId zone){
        YearMonth startYm = YearMonth.of(year, 1);
        YearMonth endYm = YearMonth.of(year, 12);
        Instant start = startYm.atDay(1).atStartOfDay(zone).toInstant();
        Instant end = endYm.atEndOfMonth().plusDays(1).atStartOfDay(zone).toInstant();
        return new InstantRange(
            start,
            end
        );
    }

    public static InstantRange forRange(LocalDate startDate, LocalDate endDate, ZoneId zone){
        Instant start = startDate.atStartOfDay(zone).toInstant();
        Instant end = endDate.atStartOfDay(zone).plusDays(1).toInstant();
        return new InstantRange(
            start,
            end
        );
    }

}