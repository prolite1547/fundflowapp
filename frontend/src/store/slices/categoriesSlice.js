import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoryService } from '../../services/api';

export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoryService.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/create',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await categoryService.createCategory(categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategoryError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export const { clearCategoryError } = categoriesSlice.actions;
export default categoriesSlice.reducer;
