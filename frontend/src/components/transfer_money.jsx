import { Dialog, DialogPanel, DialogTitle} from "@headlessui/react";
import React, { useEffect, useState} from "react";
import { useForm } from "react-hook-form";
import {toast } from "sonner";
import {formatCurrency} from "../libs";
import api from "../libs/apiCall";
import Input from './ui/input';
import Loading from "./loading";
import  {Button } from "./ui/button";
import useStore from "../store";
import DialogWrapper from "./wrappers/dailog-wrapper";
import { MdOutlineWarning } from "react-icons/md";

const TransferMoney = ({ isOpen, setIsOpen, refetch }) => {
  const { user } = useStore((state) => state);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [formAccountInfo, setFromAccountInfo] = useState({});
  const [toAccountInfo, setToAccountInfo] = useState({});

  const submitHandler = async (data) => {
    try {
      setIsLoading(true);
      const newData = {
        ...data,
        from_account: formAccountInfo.id,
        to_account: toAccountInfo.id,
      };

      const { data: res } = await api.put(`/transactions/transfer-money`, newData);
      if (res?.status === "success") {
        toast.success(res?.message);
        setIsOpen(false);
        refetch();
      }
    } catch (error) {
      console.error("Something went wrong: ", error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAccountBalance = (setAccount, val) => {
    const filteredAccount = accountData?.find((account) => account.account_name === val);
    if (filteredAccount) setAccount(filteredAccount);
  };

  function closeModal() {
    setIsOpen(false);
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
        <DialogTitle className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300 mb-4 uppercase">
          Transfer Money
        </DialogTitle>
        {isLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit(submitHandler)}>
            {/* Select Account */}
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">Select Account</p>
              <select
                defaultValue=""
                onChange={(e) => generateAccountBalance(setFromAccountInfo, e.target.value)}
                className="inputStyles"
              >
                <option value="" disabled>Select Account</option>
                {accountData.map((acc, index) => (
                  <option key={index} value={acc?.account_name}>
                    {acc?.account_name} - {formatCurrency(acc?.account_balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* From Account */}
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">To Account</p>
              <select
                defaultValue=""
                onChange={(e) => generateAccountBalance(setToAccountInfo, e.target.value)}
                className="inputStyles"
              >
                <option value="" disabled>To Account</option>
                {accountData?.map((acc, index) => (
                  <option key={index} value={acc?.account_name}>
                    {acc?.account_name} - {formatCurrency(acc?.account_balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Insufficient Balance Warning */}
            {formAccountInfo?.account_balance <= 0 && (
              <div className="flex items-center gap-2 bg-yellow-400 text-black p-2 mt-6 rounded">
                <MdOutlineWarning size={30} />
                <span className="text-sm">
                  You cannot transfer money from this account. Insufficient balance.
                </span>
              </div>
            )}

            {/* Transfer Amount Input */}
            {formAccountInfo?.account_balance > 0 && toAccountInfo.id && (
              <>
                <Input
                  type="number"
                  name="amount"
                  label="Amount"
                  placeholder="10.00"
                  {...register("amount", { required: "Amount is required" })}
                  error={errors.amount ? errors.amount.message : ""}
                  className="inputStyle"
                />

                {/* Transfer Button */}
                <div className="w-full mt-8">
                  <Button disabled={isLoading} type="submit" className="bg-violet-700 text-white w-full">
                    {`Transfer ${watch("amount") ? formatCurrency(watch("amount")) : ""}`}
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </DialogPanel>
    </DialogWrapper>
  );
};

export default TransferMoney;
