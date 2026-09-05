import React, { useEffect, useRef } from 'react';
import { X, Printer, Barcode, Copy, Download } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { Product } from '../types';
import { formatUSD } from '../utils/currency';

interface BarcodeLabelModalProps {
  product: Product | null;
  onClose: () => void;
  language: 'en' | 'kh';
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  product,
  onClose,
  language
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  const isKh = language === 'kh';

  useEffect(() => {
    if (product && barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, product.barcode, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          margin: 10
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [product]);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm">
              {isKh ? 'ស្លាកបាកូដទំនិញ' : 'Print Barcode Label'}
            </h4>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Barcode Label Card */}
        <div className="p-6 flex flex-col items-center justify-center space-y-3 bg-[#fafafa]">
          <div className="bg-white printable-paper p-4 rounded-2xl border-2 border-slate-800 shadow-sm flex flex-col items-center text-center w-full max-w-[260px]" data-preserve-white="true">
            <span className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</span>
            {product.nameKh && (
              <span className="text-[10px] text-slate-500 line-clamp-1">{product.nameKh}</span>
            )}

            {/* SVG Barcode output */}
            <div className="my-2 bg-white flex justify-center w-full overflow-hidden">
              <svg ref={barcodeSvgRef} className="max-w-full"></svg>
            </div>

            <div className="w-full flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <span className="text-[10px] text-slate-400 font-mono">CODE: {product.barcode}</span>
              <span className="font-bold text-slate-900 font-mono">{formatUSD(product.price)}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center max-w-xs">
            {isKh 
              ? 'អ្នកអាចបោះពុម្ពបិទលើផលិតផល ឬតេស្តស្កេនជាមួយកាមេរ៉ា'
              : 'Print on sticker label sheet or scan directly from screen to test.'}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            {isKh ? 'បិទ' : 'Close'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isKh ? 'បោះពុម្ព' : 'Print Label'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
