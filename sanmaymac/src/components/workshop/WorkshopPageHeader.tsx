import { ReactNode } from 'react';

interface WorkshopPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const WorkshopPageHeader = ({ title, description, actions }: WorkshopPageHeaderProps) => (
  <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-on-surface md:text-3xl">{title}</h1>
      {description ? <p className="mt-1 text-sm text-on-surface-variant">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
  </header>
);
