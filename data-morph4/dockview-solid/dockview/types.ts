//import { Parameters } from '@arminmajerie/dockview-core';
import { Parameters } from '../../dockview-core';

export interface PanelParameters<T extends {} = Parameters> {
    params: T;
}
