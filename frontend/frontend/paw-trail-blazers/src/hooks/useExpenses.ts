import { useState, useEffect } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { stellarClient } from '@/lib/stellar/client';
import { walletManager } from '@/lib/stellar/wallet';
import { ExpenseRecord } from '@/types/stellar';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all expenses
  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const totalExpenses = await stellarClient.invokeContractMethod('get_total_expenses', []);
      
      if (totalExpenses === 0) {
        setExpenses([]);
        return;
      }

      const expensePromises = [];
      for (let i = 1; i <= totalExpenses; i++) {
        expensePromises.push(
          stellarClient.invokeContractMethod('get_expense', [
            StellarSdk.nativeToScVal(i, { type: 'u64' })
          ])
        );
      }
      
      const expensesData = await Promise.all(expensePromises);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  // Record new expense
  const recordExpense = async (
    walletAddress: string,
    expenseData: {
      amount: string;
      category: string;
      description: string;
      receipt_hash: string;
      dogs_affected: number[];
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare contract arguments - Use Address properly
      const addressScVal = new StellarSdk.Address(walletAddress).toScVal();
      
      const args = [
        addressScVal,
        StellarSdk.nativeToScVal(expenseData.amount, { type: 'i128' }),
        StellarSdk.nativeToScVal(expenseData.category, { type: 'string' }),
        StellarSdk.nativeToScVal(expenseData.description, { type: 'string' }),
        StellarSdk.nativeToScVal(expenseData.receipt_hash, { type: 'string' }),
        StellarSdk.nativeToScVal(expenseData.dogs_affected, { type: 'vec' })
      ];

      const operation = stellarClient.contract.call('record_expense', ...args);

      const response = await stellarClient.buildAndSubmitTransaction(
        walletAddress,
        operation,
        async (tx) => await walletManager.signTransaction(tx.toXDR())
      );

      console.log('Expense recorded successfully:', response);
      
      await fetchExpenses();
      
      return response;
    } catch (error) {
      console.error('Error recording expense:', error);
      setError('Failed to record expense');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get expenses by feeder
  const getExpensesByFeeder = (feederId: number): ExpenseRecord[] => {
    return expenses.filter(expense => expense.feeder_id === feederId);
  };

  // Get expenses by category
  const getExpensesByCategory = (category: string): ExpenseRecord[] => {
    return expenses.filter(expense => expense.category === category);
  };

  // Get total spent by feeder
  const getTotalSpentByFeeder = (feederId: number): number => {
    return expenses
      .filter(expense => expense.feeder_id === feederId)
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return { 
    expenses, 
    loading, 
    error,
    recordExpense,
    getExpensesByFeeder,
    getExpensesByCategory,
    getTotalSpentByFeeder,
    refetch: fetchExpenses 
  };
}