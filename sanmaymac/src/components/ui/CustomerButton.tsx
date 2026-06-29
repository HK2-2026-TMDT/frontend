import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'outline' | 'chip' | 'chip-active' | 'success';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  primary: 'btn-user-primary',
  outline: 'btn-user-outline',
  chip: 'btn-user-chip',
  'chip-active': 'btn-user-chip-active',
  success: 'btn-user-success',
};

const sizeClass: Record<Size, string> = {
  sm: 'btn-user-primary-sm',
  md: 'btn-user-primary-md',
  lg: 'btn-user-primary-lg',
};

type CustomerButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

export const CustomerButton = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: CustomerButtonProps) => {
  const classes = [
    variant === 'primary' ? sizeClass[size] : variantClass[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
};

type CustomerButtonLinkProps = LinkProps & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

export const CustomerButtonLink = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: CustomerButtonLinkProps) => {
  const classes = [
    variant === 'primary' ? sizeClass[size] : variantClass[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link className={classes} {...props}>
      {children}
    </Link>
  );
};
