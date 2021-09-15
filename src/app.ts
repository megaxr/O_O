// >packup build --dist-dir ../dist index.html

// TODO: replace "../lib" to "/js" as O_O will be used as external lib
// import O_O from "../lib/O_O.ts";
// import { SomeSystem } from "../lib/systems.ts";
// import { Camera } from "../lib/components.ts";

// O_O.init(!canvas, ?options); // init engine by indicate a canvas
// O_O.xr(!xrButton, ?options); // init XR feature by indicate a button

// const system = O_O.system(SomeSystem); // add a system
// system.uid = O_O.systems[0].uid; // system can be accessed from engine

// const scene = O_O.scene(); // add a scene
// scene.uid = O_O.scenes[0].uid; // scene can be accessed from engine

// const entity = scene.entity().component(Camera); // add an entity, followed by add a component on it
// entity.uid = O_O.scenes[0].entities[0].uid; // entity can be accessed from scene

// entity.components; // component can be accessed from entity

// scene.entity().entity() // creates 2 parent-child related entities, entity(Parent)---entity(child)