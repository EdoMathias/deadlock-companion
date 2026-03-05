import React from 'react';

export interface ViewConfig {
    name: string;
    icon: React.ComponentType;
    component: React.ComponentType;
    active?: boolean;
}
