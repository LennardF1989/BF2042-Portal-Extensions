import * as extensions from "./Extensions";
import * as plugins from "./Plugins";
import * as shared from "./Shared";

BF2042Portal.Shared = shared.default;
BF2042Portal.Plugins = plugins.default;
BF2042Portal.Extensions = extensions.default;

shared.init();
extensions.init();
