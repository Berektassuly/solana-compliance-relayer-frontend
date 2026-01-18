'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, Unlock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUIStore } from '@/store/useUIStore';
import { ASSETS, MODE_LABELS } from '@/lib/constants';
import { submitTransfer } from '@/services/transfer';

// Validation schema
const transferSchema = z.object({
  asset: z.string().min(1, 'Please select an asset'),
  recipient: z
    .string()
    .min(32, 'Invalid address')
    .max(44, 'Invalid address')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid Solana address format'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be positive'),
});

type TransferFormData = z.infer<typeof transferSchema>;

export function TransferForm() {
  const { transferMode, isSubmitting, setIsSubmitting, addTransaction } = useUIStore();
  const modeConfig = MODE_LABELS[transferMode];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      asset: 'usdc',
      recipient: '',
      amount: '',
    },
  });

  const onSubmit = async (data: TransferFormData) => {
    setIsSubmitting(true);
    try {
      const { transaction } = await submitTransfer({
        mode: transferMode,
        asset: data.asset,
        recipient: data.recipient,
        amount: Number(data.amount),
      });
      
      addTransaction(transaction);
      reset();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAsset = ASSETS.find((a) => a.id === 'usdc');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Asset Select */}
      <div className="space-y-2">
        <label className="text-sm text-muted">Asset</label>
        <Controller
          name="asset"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {ASSETS.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="text-muted">—</span>
                      <span className="text-muted text-xs">{asset.description}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.asset && (
          <p className="text-xs text-status-failed">{errors.asset.message}</p>
        )}
      </div>

      {/* Recipient Input */}
      <div className="space-y-2">
        <label className="text-sm text-muted">Recipient</label>
        <Input
          placeholder="Ax39...9dK"
          {...register('recipient')}
          error={errors.recipient?.message}
        />
        <p className="text-xs text-muted-dark">Range Protocol: Clean</p>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-sm text-muted">Amount</label>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          {...register('amount')}
          error={errors.amount?.message}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={transferMode}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-xs text-muted-dark flex items-center gap-1.5"
          >
            {transferMode === 'confidential' ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
            {modeConfig.hint}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full mt-6"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'EXECUTE TRANSFER'
        )}
      </Button>
    </form>
  );
}
