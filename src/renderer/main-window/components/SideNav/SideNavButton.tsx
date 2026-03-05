import React from 'react';

interface SideNavButtonProps {
    icon: React.ComponentType;
    title: string;
    onClick: () => void;
    active: boolean;
    /** When true a small "New" badge is rendered on the button. */
    showNewBadge?: boolean;
}

const SideNavButton: React.FC<SideNavButtonProps> = ({ icon: Icon, title, onClick, active, showNewBadge }) => {
    return (
        <div className="side-nav-button-wrap">
            <span className="side-nav-button-tooltip" aria-hidden>{title}</span>
            <button className={`side-nav-button ${active ? 'side-nav-button--active' : ''}`} aria-label={title}
                aria-current={active ? 'page' : undefined} onClick={onClick}>
                <span className="side-nav-button-icon">
                    <Icon />
                    {showNewBadge && <span className="side-nav-new-badge" aria-label="New feature">New</span>}
                </span>
                <span>{title}</span>
            </button>
        </div>
    );
};

export default SideNavButton;