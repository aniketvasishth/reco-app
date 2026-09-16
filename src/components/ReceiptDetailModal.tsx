import React from 'react';
import { X, Store, Globe, Calendar, CreditCard, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoReceipt } from '../types';
import { M3_TRANSITIONS, M3_BOTTOM_SHEET_DRAG } from '../utils/motion';
import { M3Ripple } from './M3Ripple';

interface ReceiptDetailModalProps {
  receipt: CostcoReceipt | null;
  onClose: () => void;
  onSearchItemId: (itemId: string) => void;
}

export function ReceiptDetailModal({ receipt, onClose, onSearchItemId }: ReceiptDetailModalProps) {
  const isOnline = receipt?.orderType === 'Online';
  const { onPointerDown: onTagPointerDown, renderRipples: renderTagRipples } = M3Ripple({ color: 'bg-m3-primary/20' });
  const { onPointerDown: onClosePointerDown, renderRipples: renderCloseRipples } = M3Ripple({ color: 'bg-white/20' });

  return (
    <AnimatePresence>
      {receipt && (
        <motion.div
          key="receipt-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            layoutId={`receipt-container-${receipt.orderNumber}`}
            initial={{ opacity: 0, scale: 0.94, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 60 }}
            transition={M3_TRANSITIONS.emphasizedEnter}
            drag={M3_BOTTOM_SHEET_DRAG.drag}
            dragConstraints={M3_BOTTOM_SHEET_DRAG.dragConstraints}
            dragElastic={M3_BOTTOM_SHEET_DRAG.dragElastic}
            onDragEnd={(_, info) => {
              if (
                info.offset.y > M3_BOTTOM_SHEET_DRAG.dismissThresholdY ||
                info.velocity.y > M3_BOTTOM_SHEET_DRAG.dismissVelocityY
              ) {
                onClose();
              }
            }}
            className="bg-m3-surface-container text-m3-on-surface w-full max-w-xl rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-m3-outline-variant/60 overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh] touch-pan-y"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle Bar */}
            <div className="pt-2 pb-1 bg-m3-primary flex justify-center sm:hidden cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-white/40" />
            </div>

            {/* Receipt Header Bar */}
            <div className="bg-m3-primary text-m3-on-primary px-4 py-3.5 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-m3-on-primary/15 flex items-center justify-center">
                  {isOnline ? (
                    <Globe className="w-5 h-5 text-m3-on-primary" />
                  ) : (
                    <Store className="w-5 h-5 text-m3-on-primary" />
                  )}
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-m3-on-primary/80 block">
                    {isOnline ? 'Costco Online Order' : 'Costco Warehouse Receipt'}
                  </span>
                  <h2 className="text-lg font-bold text-m3-on-primary leading-tight font-mono">
                    #{receipt.orderNumber}
                  </h2>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={onClosePointerDown}
                onClick={onClose}
                className="relative overflow-hidden w-9 h-9 rounded-full flex items-center justify-center text-m3-on-primary/80 hover:text-m3-on-primary hover:bg-m3-on-primary/10 transition-colors cursor-pointer"
                aria-label="Close receipt details"
              >
                {renderCloseRipples()}
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Receipt Metadata Info Bar */}
            <div className="bg-m3-surface-container-high border-b border-m3-outline-variant/40 px-6 py-3.5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-m3-on-surface-variant font-bold uppercase tracking-wider block">
                  Transaction Date
                </span>
                <span className="font-semibold text-m3-on-surface flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-m3-primary" />
                  {receipt.orderDate}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-m3-on-surface-variant font-bold uppercase tracking-wider block">
                  Payment Card
                </span>
                <span className="font-semibold text-m3-on-surface flex items-center gap-1.5 mt-0.5 truncate">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{receipt.paymentCard || 'Costco Anywhere Visa'}</span>
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] text-m3-on-surface-variant font-bold uppercase tracking-wider block">
                  Warehouse / Fulfillment
                </span>
                <span className="font-semibold text-m3-on-surface block mt-0.5 truncate">
                  {receipt.warehouseLocation}
                </span>
              </div>
            </div>

            {/* Receipt Line Items */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider pb-1.5 border-b border-m3-outline-variant/40">
                <span>{receipt.isReturn ? 'Items Refunded' : 'Items Purchased'} ({receipt.items.length})</span>
                <span>Amount</span>
              </div>

              <div className="divide-y divide-m3-outline-variant/30">
                {receipt.items.map((it, idx) => (
                  <div key={`${receipt.id}_${it.id || idx}_${it.itemId || idx}`} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onPointerDown={onTagPointerDown}
                          onClick={() => {
                            onSearchItemId(it.itemId);
                            onClose();
                          }}
                          title="Filter purchases by this Item ID"
                          className="relative overflow-hidden inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-m3-secondary-container text-m3-on-secondary-container font-mono text-[11px] font-bold transition-colors hover:opacity-90 cursor-pointer"
                        >
                          {renderTagRipples()}
                          <Tag className="w-3 h-3 text-m3-primary" />
                          #{it.itemId}
                        </motion.button>
                        {it.brand && (
                          <span className="text-[11px] font-medium text-m3-on-surface-variant">{it.brand}</span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-m3-on-surface mt-1">
                        {it.productName || it.rawName}
                      </h4>
                      {it.rawName && it.productName && it.rawName !== it.productName && (
                        <span className="text-[11px] text-m3-on-surface-variant font-mono block">
                          Receipt: {it.rawName}
                        </span>
                      )}
                      <span className="text-[11px] text-m3-on-surface-variant">
                        Qty: {it.quantity} × ${Math.abs(it.unitPrice).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs sm:text-sm font-bold block font-mono ${
                        it.isReturn ? 'text-m3-error dark:text-[#ffb4ab]' : 'text-m3-on-surface'
                      }`}>
                        {it.isReturn ? `-$${Math.abs(it.totalPrice).toFixed(2)}` : `$${it.totalPrice.toFixed(2)}`}
                      </span>
                      {it.discount && it.discount > 0 && (
                        <span className="text-[10px] text-m3-error font-semibold block">
                          -${it.discount.toFixed(2)} savings
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Receipt Financial Totals */}
              <div className="mt-4 pt-3 border-t border-dashed border-m3-outline-variant/60 space-y-1.5 text-xs text-m3-on-surface-variant">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-m3-on-surface font-mono">
                    {receipt.subtotal < 0 ? `-$${Math.abs(receipt.subtotal).toFixed(2)}` : `$${receipt.subtotal.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-semibold text-m3-on-surface font-mono">
                    {receipt.tax < 0 ? `-$${Math.abs(receipt.tax).toFixed(2)}` : `$${receipt.tax.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-m3-on-surface pt-2 border-t border-m3-outline-variant/40">
                  <span>{receipt.isReturn ? 'Total Refunded:' : 'Total Paid:'}</span>
                  <span className={`font-mono ${
                    receipt.isReturn ? 'text-m3-error dark:text-[#ffb4ab]' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {receipt.total < 0 ? `-$${Math.abs(receipt.total).toFixed(2)}` : `$${receipt.total.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-m3-outline-variant/40 bg-m3-surface-container-high flex items-center justify-end text-xs">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-m3-surface-container-highest hover:bg-m3-surface-container-high font-semibold text-m3-on-surface transition-colors cursor-pointer border border-m3-outline-variant/30"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
