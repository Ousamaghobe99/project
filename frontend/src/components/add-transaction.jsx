import React from "react";
import {
  DialogPanel,
  DialogTitle,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { formatCurrency } from "../libs";
import api from "../libs/apiCall";
import useStore from "./../store";
import { Button } from "./ui/button";
import Loading from "./loading";
import Input from "./ui/input";
import DialogWrapper from "./wrappers/dailog-wrapper";
import CategorySelect from "./category-select";
import { Icon } from '@iconify/react';

const AddTransaction = ({ isOpen, setIsOpen, refetch }) => {
  const { user } = useStore((state) => state);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [selectedTab, setSelectedTab] = useState(0);
  const [accountBalance, setAccountBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [accountInfo, setAccountInfo] = useState(null);
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState(null);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState(null);

  const handleIncomeCategoryChange = (category) => {
    setSelectedIncomeCategory(category);
  };

  const handleExpenseCategoryChange = (category) => {
    setSelectedExpenseCategory(category);
  };

  const submitHandler = async (data) => {
    try {
      const selectedCategory = selectedTab === 0 ? selectedIncomeCategory : selectedExpenseCategory;
      const category = selectedCategory?.name;
      const icon = selectedCategory?.icon;

      setLoading(true);
      const newData = {
        ...data,
        amount: Number(data.amount),
        type:
          selectedTab === 0
            ? "income"
            : selectedTab === 1
            ? "expense"
            : "transfer",
        source: accountInfo.account_name,
       
      };

      if (selectedTab === 2) {
        newData.destination_account_id = data.destinationAccountId;
      } else {
        newData.category = category;
        newData.icon = icon;
      }

      const { data: res } = await api.post(
        `transactions/add-transaction/${accountInfo.id}`,
        newData
      );

      if (res?.status === "success") {
        toast.success(res?.message);
        setIsOpen(false);
        reset();
        refetch();
      }
    } catch (error) {
      console.error("Something went wrong", error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAccountBalance = (val) => {
    const filteredAccount = accountData?.find(
      (account) => account.account_name === val
    );
    setAccountBalance(filteredAccount ? filteredAccount.account_balance : 0);
    setAccountInfo(filteredAccount);
  };

  function closeModal() {
    setIsOpen(false);
    reset();
    setSelectedTab(0);
  }

  const fetchAccounts = async () => {
    try {
      const { data: res } = await api.get(`/account`);
      setAccountData(res?.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <DialogWrapper isOpen={isOpen} closeModal={closeModal}>
      <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left">
        <DialogTitle
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300 mb-4 uppercase border-b pb-5"
        >
          Add Transaction
        </DialogTitle>

        {isLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit(submitHandler)}>
            <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
              <TabList className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-4">
                {["Income", "Expense", "Transfer"].map((tab, idx) => (
                  <Tab
                    key={tab}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700
                                           ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2
                                           ${
                                             selectedTab === idx
                                               ? "bg-white shadow"
                                               : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                                           }`}
                  >
                    {tab}
                  </Tab>
                ))}
              </TabList>

              {/* Source Account Selection (Common for all tabs) */}
              <div className="flex flex-col gap-1 mb-4">
                <label className="text-sm text-gray-700 dark:text-gray-400 mb-1">
                  Select Account
                </label>
                <select
                  {...register("sourceAccount", { required: true })}
                  className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                  onChange={(e) => getAccountBalance(e.target.value)}
                >
                  <option value="">Select Account</option>
                  {accountData.map((account) => (
                    <option key={account.id} value={account.account_name}>
                      {account.account_name} (
                      {formatCurrency(account.account_balance)})
                    </option>
                  ))}
                </select>
                {errors.sourceAccount && (
                  <span className="text-red-500 text-xs">
                    Source account is required
                  </span>
                )}
              </div>

              <TabPanels className="mt-2">
                {/* Income Tab */}
                <TabPanel>
                  <div className="flex flex-col gap-1 mb-4">
                    <label className="text-sm text-gray-700 dark:text-gray-400 mb-1">
                      Category
                    </label>
                    <CategorySelect
                      type="income"
                      onCategoryChange={handleIncomeCategoryChange}
                      userId={user?.id}
                    />
                    {selectedIncomeCategory && (
                      <div className="flex items-center mt-2">
                        <Icon icon={selectedIncomeCategory.icon} className="mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedIncomeCategory.name}
                        </span>
                      </div>
                    )}
                    {errors.category && (
                      <span className="text-red-500 text-xs">
                        Category is required
                      </span>
                    )}
                  </div>
                </TabPanel>

                {/* Expense Tab */}
                <TabPanel>
                  <div className="flex flex-col gap-1 mb-4">
                    <label className="text-sm text-gray-700 dark:text-gray-400 mb-1">
                      Category
                    </label>
                    <CategorySelect
                      type="expense"
                      onCategoryChange={handleExpenseCategoryChange}
                      userId={user?.id}
                    />
                    {selectedExpenseCategory && (
                      <div className="flex items-center mt-2">
                        <Icon icon={selectedExpenseCategory.icon} className="mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedExpenseCategory.name}
                        </span>
                      </div>
                    )}
                    {errors.category && (
                      <span className="text-red-500 text-xs">
                        Category is required
                      </span>
                    )}
                  </div>
                </TabPanel>

                {/* Transfer Tab */}
                <TabPanel>
                  <div className="flex flex-col gap-1 mb-4">
                    <label className="text-sm text-gray-700 dark:text-gray-400 mb-1">
                      Destination Account
                    </label>
                    <select
                      {...register("destinationAccountId", {
                        required: selectedTab === 2,
                      })}
                      className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value="">Select Destination Account</option>
                      {accountData
                        .filter((account) => account.id !== accountInfo?.id)
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name} (
                            {formatCurrency(account.account_balance)})
                          </option>
                        ))}
                    </select>
                    {errors.destinationAccountId && (
                      <span className="text-red-500 text-xs">
                        Destination account is required
                      </span>
                    )}
                  </div>
                </TabPanel>
              </TabPanels>
            </TabGroup>

            {/* Common Fields */}
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-sm text-gray-700 dark:text-gray-400 mb-1">
                Amount
              </label>
              <Input
                type="number"
                {...register("amount", {
                  required: true,
                  min: 0.01,
                })}
                className="w-full"
              />
              {errors.amount && (
                <span className="text-red-500 text-xs">
                  {errors.amount.type === "min"
                    ? "Amount must be greater than 0"
                    : "Amount is required"}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 mb-6">
              <label className="text-sm text-gray-700 dark:text-gray-400 mb-1">
                Description
              </label>
              <Input
                type="text"
                {...register("description")}
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loading /> : "Add Transaction"}
              </Button>
            </div>
          </form>
        )}
      </DialogPanel>
    </DialogWrapper>
  );
};

export default AddTransaction;