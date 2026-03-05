import React from 'react';
import RotationsIcon from './components/RotationsIcon';

/**
 * Rotations / Ability Build Planner — placeholder for Deadlock.
 *
 * The full rotation editor structure is preserved in ./components, ./hooks,
 * and ./types for future repurposing with Deadlock hero abilities.
 * Hero data will be sourced from the deadlock-api assets API:
 * https://assets.deadlock-api.com
 */
const Rotations: React.FC = () => {
  return (
    <section className="rotations-container coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <RotationsIcon />
        </div>
        <h2 className="coming-soon-title">Ability Build Planner</h2>
        <p className="coming-soon-description">
          Plan and save ability build orders for your Deadlock heroes. This
          feature is currently under development.
        </p>
        <p className="coming-soon-hint">
          Hero data will be sourced from{' '}
          <a
            href="https://assets.deadlock-api.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            assets.deadlock-api.com
          </a>
          .
        </p>
      </div>
    </section>
  );
};

export default Rotations;
