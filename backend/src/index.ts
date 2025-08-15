import * as ai from "applicationinsights";
ai.setup().start();

import './functions/battle-logs';
import './functions/master';
import './functions/export';
import './functions/health';