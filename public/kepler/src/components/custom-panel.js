import {SidePanelFactory, MapControlFactory, Icons} from 'kepler.gl/components';
import {SIDEBAR_PANELS} from 'kepler.gl/constants';

console.log('Icons', Icons);

/* MAP CONTROL (right top icons) */
function CustomMapControlFactory(...args) {
  const CustomMapControl = MapControlFactory(...args);

  window.CustomMapControl = CustomMapControl;

  return CustomMapControl;
}

CustomMapControlFactory.deps = MapControlFactory.deps;


/*  SIDE PANEL */
function CustomSidePanelFactory(...args) {
  const CustomSidePanel = SidePanelFactory(...args);

  window.CustomSidePanel = CustomSidePanel;

  CustomSidePanel.defaultProps = {
    ...CustomSidePanel.defaultProps,
    panels: SIDEBAR_PANELS.filter(({id}) => id === 'filter')
  };

  return CustomSidePanel;
}

CustomSidePanelFactory.deps = SidePanelFactory.deps;


export {CustomMapControlFactory, CustomSidePanelFactory};
