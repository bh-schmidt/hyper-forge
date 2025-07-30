import { ForgeComposer } from "./ForgeComposer";

import { createForge } from "@/forges/ForgeBuilder";
import * as FileInjectors from './file-injectors/Index';
import * as Forges from './forges/Index';
import { VariableMapper } from "./forges/Index";
import * as NameInjectors from './name-injectors/Index';
import * as Types from './Types';
import * as Utils from './utils/Index';

export * from './Types';

export {
    createForge, FileInjectors, ForgeComposer, Forges,
    NameInjectors,
    Utils, VariableMapper
};

const hyperForge = {
    createForge,
    ForgeComposer,
    VariableMapper,
    FileInjectors,
    Forges,
    NameInjectors,
    Utils,
    ...Types
}

export default hyperForge

