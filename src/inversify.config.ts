import { Container } from "inversify";
import { ErrorsPeekABoo } from "./core/errors-peekaboo";
import { ErrorsVisualization } from "./core/errors-visualization/errors-visualization";

const myContainer = new Container();
myContainer.bind<ErrorsPeekABoo>(ErrorsPeekABoo).toSelf().inSingletonScope();
myContainer.bind<ErrorsVisualization>(ErrorsVisualization).toSelf().inSingletonScope();

export { myContainer };
