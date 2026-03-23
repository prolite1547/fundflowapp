import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { budgetService } from '../../services/api';

export const fetchBudgets = createAsyncThunk(
  'budgets/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await budgetService.getBudgets(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch budgets');
    }
  }
);

export const createBudget = createAsyncThunk(
  'budgets/create',
  async (budgetData, { rejectWithValue }) => {
    try {
      const response = await budgetService.createBudget(budgetData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create budget');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    clearBudgetError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        // Find if a budget for this category and month/year already exists, remove it then add this
        const index = state.items.findIndex(b => 
          b.categoryId === action.payload.categoryId && 
          b.month === action.payload.month && 
          b.year === action.payload.year
        );
        if (index >= 0) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      });
  },
});

export const { clearBudgetError } = budgetsSlice.actions;
export default budgetsSlice.reducer;
