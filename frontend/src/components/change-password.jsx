import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import api from '../libs/apiCall';
import { toast } from 'sonner';
import Input from './ui/input';

import { BiLoader } from 'react-icons/bi';
import { Button } from './ui/button';

export const ChangePassword = () => {
 
    const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm({
    
  });
  const [loading, setLoading] = useState(false);

  const submitPasswordHandler = async (data) => {
    try {
        setLoading(true)

        const { data: res } = await api.put(`/user/changePassword`,data);

        if(res?.status === "success") {
            toast.success(res?.message);
        }
    } catch (error) {
        console.error('something went wrong', error);
        toast.error(error?.response?.data?.message || error.message);
    } finally {
        setLoading(false);
    }
}

 
    return (
    <div className=' ppy-20'>
      <form onSubmit={handleSubmit(submitPasswordHandler)}>
        <div className='space-y-6'>
            <p className='text-xl font-bold text-black dark:text-white mb-1'>
                Change Password
            </p>
            <span className='labelStyles'>
                This will be used
            </span>
            <div className='mt-6 space-y-6' >
                <Input
                    disabled ={loading}
                    type='password'
                    name='currentPassword'
                    label='Current Password'
                    className='inputStyle'
                    {...register('currentPassword',{
                        required: "Current Password is required",
                    })} 
                    error = {
                        errors.currentPassword ? errors.currentPassword.message : ""
                    }
                />
                <Input
                    disabled ={loading}
                    type='password'
                    name='newPassword'
                    label='New Password'
                    className='inputStyle'
                    {...register('newPassword',{
                        required: "Newt Password is required",
                    })} 
                    error = {
                        errors.newPassword ? errors.newPassword.message : ""
                    }
                />
                <Input
                    disabled ={loading}
                    type='password'
                    name='confirmPassword'
                    label='Confirm Password'
                    className='inputStyle'
                    {...register('confirmPassword',{
                        required: "confirm Password is required",
                        validate:(val) => {
                            const {newPassword} = getValues();
                            return newPassword === val || "Password does not match";
                        }
                    })} 
                    error = {
                        errors.confirmPassword ? errors.confirmPassword.message : ""
                    }
                />
            </div>
        </div>
                    
        <div className='flex items-center gap-6 mt-10 justify-end pb-10 border-b-2 border-gray-200 dark:border-gray-800'>
        <Button
          variant="outline"
          type="reset"
          
          disabled={loading}
          className="px-6 bg-transparent text-black dark:text-white border border-gray-200 dark:border-gray-700"
        >
          Reset 
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="px-8 bg-violet-800 text-white flex items-center justify-center gap-2"
        >
          {loading && <BiLoader className="animate-spin" />}
          {loading ? "changing password" : "change password"}
        </Button>
      </div>
      </form>
    </div>
  )
}

