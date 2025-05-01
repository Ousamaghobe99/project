import React, { useState } from "react";
import useStore from "../store";
import { useForm } from "react-hook-form";
import { generateAccountNumber } from "../libs";
import DialogWrapper from "./wrappers/dailog-wrapper";
import { DialogPanel, DialogTitle } from "@headlessui/react";
import { BiLoader } from "react-icons/bi";
import Input from '../components/ui/input';
import { Button } from "./ui/button";
import api from "../libs/apiCall";
import { toast } from "sonner";
import { MdOutlineWarning } from "react-icons/md";

const ACCOUNT_TYPES = {
  Credit: ["Cash", "D17", "Bank Card"],
  Savings: ["Savings Account", "Fixed Deposit", "Emergency Fund"],
  Investment: ["Stocks", "Bonds", "Mutual Funds", "Retirement Account"],
  Loan: ["Personal Loan", "Mortgage", "Auto Loan"],
};

export const AddAccount = ({ isOpen, setIsOpen, refetch }) => {
  const { user } = useStore((state) => state);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { account_number: generateAccountNumber() },
  });

  const [selectedType, setSelectedType] = useState("Credit");
  const [selectedAccount, setSelectedAccount] = useState(ACCOUNT_TYPES.Credit[0]);
  const [loading, setLoading] = useState(false);
  
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const newData = { 
        ...data,
        account_type: selectedType, 
        name: selectedAccount 
      };
      
      const { data: res } = await api.post(`/account/create`, newData);
      
      if (res?.data) {
        toast.success(res?.message);
        setIsOpen(false);
        reset();
        refetch();
      }
    } catch (error) {
      console.error("Account creation failed:", error);
      toast.error(error?.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogWrapper isOpen={isOpen} closeModal={() => setIsOpen(false)}>
      <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all">
        <DialogTitle
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300 mb-4 uppercase"
        >
          Add Account
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Type Selection */}
          <div className="flex flex-col gap-1 mb-2">
            <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
              Select Account Type
            </p>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSelectedAccount(ACCOUNT_TYPES[e.target.value][0]);
              }}
              className="bg-transparent appearance-none border border-gray-300 dark:border-gray-800 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-500 outline-none focus:ring-1 ring-blue-500"
            >
              {Object.keys(ACCOUNT_TYPES).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Account Selection */}
          <div className="flex flex-col gap-1 mb-2">
            <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
              Select Account
            </p>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-transparent appearance-none border border-gray-300 dark:border-gray-800 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-500 outline-none focus:ring-1 ring-blue-500"
            >
              {ACCOUNT_TYPES[selectedType].map((account, index) => (
                <option key={index} value={account}>{account}</option>
              ))}
            </select>
          </div>

          {/* Duplicate Account Warning */}
          {user?.accounts?.includes(selectedAccount)  && (
            <div className="flex items-center gap-2 bg-yellow-400 text-black p-2 rounded">
              <MdOutlineWarning size={30} />
              <span className="text-sm">
                {selectedAccount} ({selectedType}) account already exists
              </span>
            </div>
          )}

          {!user?.accounts?.some(acc => 
            acc.name === selectedAccount && 
            acc.account_type === selectedType
          ) && (
            <>
              {!selectedAccount.includes("Cash") && (
                <Input
                  type="number"
                  label="Account Number"
                  placeholder="3864736573648"
                  {...register("account_number", {
                    required: !selectedAccount.includes("Cash") && "Account number is required",
                    valueAsNumber: true
                  })}
                  error={errors.account_number?.message}
                  disabled={selectedAccount.includes("Cash")}
                />
              )}

              <Input
                type="number"
                label="Initial Amount"
                placeholder="10.0"
                step="0.01"
                {...register("amount", {
                  required: "Initial amount is required",
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Amount must be positive" }
                })}
                error={errors.amount?.message}
              />

              <Input
                label="Description"
                placeholder="Account description"
                {...register("description", {
                  maxLength: { value: 100, message: "Max 100 characters" }
                })}
                error={errors.description?.message}
              />

              <Button
                type="submit"
                disabled={loading}
                className="bg-violet-700 text-white w-full mt-4 hover:bg-violet-600 disabled:opacity-50"
              >
                {loading ? (
                  <BiLoader className="text-xl animate-spin text-white" />
                ) : (
                  "Create Account"
                )}
              </Button>
            </>
          )}
        </form>
      </DialogPanel>
    </DialogWrapper>
  );
};