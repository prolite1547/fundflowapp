import { configureStore } from '@reduxjs/toolkit';
import accountsReducer from './slices/accountsSlice';
import transactionsReducer from './slices/transactionsSlice';
import categoriesReducer from './slices/categoriesSlice';
import budgetsReducer from './slices/budgetsSlice';

export const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    transactions: transactionsReducer,
    categories: categoriesReducer,
    budgets: budgetsReducer
  }
});
