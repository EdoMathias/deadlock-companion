import React from 'react';

interface SideNavToggleProps {
    navExpanded: boolean;
    setNavExpanded: (navExpanded: boolean) => void;
}

const SideNavToggle: React.FC<SideNavToggleProps> = ({ navExpanded, setNavExpanded }) => {
    return (
        <button
            type="button"
            className="side-nav-toggle"
            onClick={() => setNavExpanded(!navExpanded)}
            title={navExpanded ? 'Collapse menu' : 'Expand menu'}
            aria-expanded={navExpanded}
        >
            <span>{navExpanded ? '<<' : '>>'}</span>
        </button>
    );
};

export default SideNavToggle;