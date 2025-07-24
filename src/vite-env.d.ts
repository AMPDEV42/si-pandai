/// <reference types="vite/client" />

declare module '*.jsx' {
  import { ComponentType } from 'react';
  const component: ComponentType;
  export default component;
}

// Add type definitions for @/ imports
declare module '@/pages/*';
declare module '@/components/*';
declare module '@/contexts/*';
declare module '@/lib/*';

// Add type definitions for CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
