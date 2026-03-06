import { ViewConfig } from '../types/views.types';
import {
  Rotations,
  LiveMatchView,
  MatchHistoryView,
  ProfileView,
  ContributeView,
} from '../views';
import LiveMatchIcon from '../views/LiveMatch/components/LiveMatchIcon';
import MatchHistoryIcon from '../views/MatchHistory/components/MatchHistoryIcon';
import ProfileIcon from '../views/Profile/components/ProfileIcon';
import RotationsIcon from '../views/Rotations/components/RotationsIcon';
import ContributeIcon from '../views/Contribute/components/ContributeIcon';

export const viewsConfig: ViewConfig[] = [
  {
    name: 'Live Match',
    icon: LiveMatchIcon,
    component: LiveMatchView,
    active: true,
  },
  {
    name: 'Match History',
    icon: MatchHistoryIcon,
    component: MatchHistoryView,
    active: false,
  },
  {
    name: 'Contribute',
    icon: ContributeIcon,
    component: ContributeView,
    active: false,
  },
  {
    name: 'Profile',
    icon: ProfileIcon,
    component: ProfileView,
    active: false,
  },
];
