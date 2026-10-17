import React, { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionContextType {
  value?: string | string[];
  onItemToggle: (itemValue: string) => void;
  isItemOpen: (itemValue: string) => boolean;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

interface AccordionItemContextType {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextType | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

export function Accordion({
  type = 'single',
  collapsible = true,
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className = '',
  ...props
}: AccordionProps) {
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue ?? (type === 'multiple' ? [] : '')
  );

  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;

  const onItemToggle = (itemValue: string) => {
    if (type === 'single') {
      const current = typeof activeValue === 'string' ? activeValue : '';
      const next = current === itemValue ? (collapsible ? '' : current) : itemValue;
      if (controlledValue === undefined) setInternalValue(next);
      onValueChange?.(next);
    } else {
      const currentList = Array.isArray(activeValue) ? activeValue : [];
      const exists = currentList.includes(itemValue);
      const nextList = exists
        ? currentList.filter((v) => v !== itemValue)
        : [...currentList, itemValue];
      if (controlledValue === undefined) setInternalValue(nextList);
      onValueChange?.(nextList);
    }
  };

  const isItemOpen = (itemValue: string) => {
    if (type === 'single') {
      return activeValue === itemValue;
    }
    return Array.isArray(activeValue) && activeValue.includes(itemValue);
  };

  return (
    <AccordionContext.Provider value={{ value: activeValue, onItemToggle, isItemOpen }}>
      <div className={className} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className = '', children, ...props }, ref) => {
    const ctx = useContext(AccordionContext);
    const isOpen = ctx ? ctx.isItemOpen(value) : false;

    return (
      <AccordionItemContext.Provider value={{ value, isOpen }}>
        <div
          ref={ref}
          data-state={isOpen ? 'open' : 'closed'}
          className={`border-b ${className}`.trim()}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className = '', children, ...props }, ref) => {
    const itemCtx = useContext(AccordionItemContext);
    const accordionCtx = useContext(AccordionContext);
    const isOpen = itemCtx ? itemCtx.isOpen : false;

    return (
      <div className="flex">
        <button
          ref={ref}
          type="button"
          onClick={() => itemCtx && accordionCtx?.onItemToggle(itemCtx.value)}
          data-state={isOpen ? 'open' : 'closed'}
          aria-expanded={isOpen}
          className={`flex flex-1 items-center justify-between font-medium transition-all cursor-pointer text-left ${className}`.trim()}
          {...props}
        >
          {children}
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className = '', children, ...props }, ref) => {
    const itemCtx = useContext(AccordionItemContext);
    const isOpen = itemCtx ? itemCtx.isOpen : false;

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        data-state={isOpen ? 'open' : 'closed'}
        className={`overflow-hidden text-sm transition-all ${className}`.trim()}
        {...props}
      >
        <div className="pt-0">{children}</div>
      </div>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';
