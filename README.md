<img alt="ELQ logo" src="http://gergeo.se/images/elq-logo-v1-github.png" width="230">

# ELQ

Element queries for modular responsive components.

File size is a bit big at the moment (237 KB, 16 KB minified + gzip). In the future, we will remove the lodash dependency, reducing the size to something like (70 KB, 6 KB minified + gzip).

Big thanks to [Evry](http://evry.com/) sponsoring the project.

## Why Element Queries?

Element queries are not for the faint hearted (read: not suitable for all projects).
If your web app consists of modules that are (or should be) responsive – then this is most probably something for you!
Otherwise, move on and come back another time :)

## Why ELQ?

Since element queries have not been standardized (and not implemented in browsers), developers need to resort to JavaScript to provide element queries.
There are numerous libraries that enable element queries in different ways, but here are the main selling points to why we believe ELQ is the best solution:

- Optimized element resize detection
- Extensibility through plugins
- batch processed updates of elements breakpoint states (to avoid layout thrashing).
- Compatibility with browsers (IE8+, Opera 12+, etc).
- Compatibility with existing code (conforms to HTML, JS and CSS specs).
- A runtime cycle detection system
- Allowing style encapsulation of responsive elements (for nested responsive modules).

For a very detailed description of ELQ and element queries, read the [Master's Thesis](http://kth.diva-portal.org/smash/get/diva2:850230/FULLTEXT01.pdf). The API and architecture is somewhat outdated, but the Thesis is still relevant for understanding ELQ.

# Documentation

We haven't had time to write proper docs yet. What follows is really a minimal explanation of the API.

## Usage example

Once the `dist/elq.js` file is included into the HTML (it is built with UMD, so include it as you wish) it exposes a global function `Elq`. This is a constructor that creates ELQ instances. It is recommended to only use one instance per application.

```js
// Creating an ELQ instance is easy!
var elq = Elq();

// It also accepts an options object.
var elq = Elq({
  cycleDetection: false
});
```

The main idea is to annotate elements with breakpoints of interest so that children can be conditionally styled in CSS by targeting the different breakpoint states. ELQ is bundled with three plugins as default, that let you annotate breakpoints as attributes of your elements like so:
```html
<div class="foo" elq elq-breakpoints elq-breakpoints-widths="300 500">
  <p>When in doubt, mumble.</p>
</div>
```

When ELQ has processed the element, it will always have two classes, one for each breakpoint, that tells if the size of the element is greater or lesser than each breakpoint. For instance, if the element is 400 pixels wide, the element has the two classes `elq-min-width-300px` and `elq-max-width-500px`. Similarly, if the element is 200 pixels wide the element the classes are instead `elq-max-width-300px` and `elq-max-width-500px`. So for each breakpoint only the `min/max` part changes.

It may seem alien that the classes describe that the width of the element is both maximum 300 and 500 pixels. This is because we have taken a user-centric approach, so that when using the classes in CSS the API is similar to media queries. However, developers are free to change this API at will as `elq` is plugin-based.

Now that we have defined the breakpoints of the element, we can conditionally style it by using the classes:

```css
.foo.elq-min-width-300px.elq-max-width-500px {
  background: green;
}

.foo.elq-min-width-500px {
  background: blue;
}

.foo.elq-max-width-500px p {
  color: white;
}
```

This API is sufficient for applications that do not need nested breakpoint elements, and similar features is provided by related libraries. However, using such API in responsive modules still limits the reusability since the modules then may not exist in an outer responsive context.

The reason this API is not sufficient for nested modules is because there is no way to limit the CSS matching search of the selectors. The selector `.foo.elq-max-width-500px p` specifies that all paragraph elements should have white text if *any* ancestor breakpoints element is above 500 pixels wide. Since the ancestor selector may match elements outside of the module, such selectors are dangerous to use in the context of responsive modules. The problem may be somewhat reduced by more specific selectors and such, but it cannot be fully solved for arbitrary styling.

To solve this problem, we provide a plugin that let us define elements to "mirror" the breakpoints classes of the nearest ancestor breakpoints element. Then, the conditional style of the mirror element may be written as a combinatory selector that is relative to the nearest ancestor breakpoints element.

Let's expand our example HTML to include to nested modules, that uses the `mirror` API.
```html
<div class="foo" elq elq-breakpoints elq-breakpoints-widths="300 500">
  <div class="foo" elq elq-breakpoints elq-breakpoints-widths="300 500">
    <p elq elq-mirror>When in doubt, mumble.</p>
  </div>
  <p elq elq-mirror>When in doubt, mumble.</p>
</div>
```

As the paragraph elements are mirroring the nearest `.foo` ancestor, we can now write CSS in the following encapsulated way:
```css
.foo {
  /* So that the nested module behaves differently */
  width: 50%;
}

.foo p.elq-max-width-500px {
  color: white;
}
```

Since we in the previous examples have annotated elements manually, the power and flexibility of the API have not been properly displayed. Only when combined with JavaScript, things get more interesting. To be continued...

## Public API

An ELQ instance exposes the following public methods:

### elq.getVersion()
Returns the version of instance.

### elq.use(plugin)
Registers a plugin to be used by the instance. Parameter is required to be a *plugin definition object*.

Returns the registered plugin instance.

### elq.using(plugin)
Tells if the given plugin has been registered or not. Parameter can be a plugin name (of type `string`) or a *plugin definition object*.

Returns a `boolean`.

### elq.activate(elements)
Activates the given collection of elements. This triggers ELQ to perform its work so that all element queries are updated.
Plugins are invoked, so that they can perform their logic. Resize listeners are also installed when propriate.
Elements may be activated multiple times.

Parameter can be any collection of elements, and also accepts a single element. The are assumed to be ELQ-elements and it is not recommended to activate non-ELQ elements.

### elq.deactivate(elements)
Deactivates the given collection of elements. This stops all ELQ and plugin systems started by activation.

### elq.listenTo([element], event, callback)
Registers a callback to be called for an event of an element. The element parameter is option, and if omitted the callback will be called when the event is emitted for any element.

## Options

### cycleDetection
Type: `Boolean`  
Default: `true`

When enabled, the cycle detection system tries to detect cyclic rules and breaks them if needed. When a cycle is detected, a console warning is printed. This may be helpful during development to catch cycles.

### defaultUnit
Type `String`  
Valid values: `"px"` `"em"` `"rem"`  
Default: `"px"`

Sets the default unit for all breakpoints that do not have a unit postfix. For instance, if defaultUnit is set to `"em"`, the breakpoint `300` is interpreted as `300em` while breakpoint `500px` is still interpreted as `500px`.

## Architecture & Plugins

One our of contributions is to allow ELQ to be easily extended with plugins. For example, if annotating HTML is undesired it is possible to create a plugin that instead parses CSS. Likewise, if adding breakpoint classes to element is undesired it is possible to create a plugin that does something else when a breakpoint state of an element has changed. In order to enable such powerful behavior altering by plugins, extensibility has been the main focus when designing the ELQ architecture.

### Plugin Definition Object

A plugin is defined by a *plugin definition object* and has the following structure:
```js
var myPluginDefinition = {
  getName: function () {
    return "my-plugin";
  },
  getVersion: function () {
    return "0.0.0";
  },
  isCompatible: function (elq) {
    return true;
  },
  make: function (elq, options) {
    return {};
  }
};
```

All of the methods are invoked when registered to an ELQ instance.
The `getName` and `getVersion` methods tells the name and version of the plugin.
The `isCompatible` tells if the plugin is compatible with the ELQ instance that it is registered to.
In the `make` method the plugin may initialize itself to the ELQ instance and return an object that defines the API accessible by ELQ and other plugins.

When necessary, ELQ invokes certain methods of the plugin API, if implemented, to let plugins decide the behavior of the system. Those methods are the following:

* `activate(element)`: Called when an element is requested to be activated, in order for plugins to initialize listeners and element properties.
* `getElements(element)`: Called in order to let plugins reveal extra elements to be activated in addition to the given element.
* `getBreakpoints(element)`: Called to retrieve the current breakpoints of an element.
* `applyBreakpointStates(element, breakpointStates)`: Called to apply the given breakpoint states of an element.

In addition, plugins may also listen to the following ELQ events:

* `resize(element)`: Emitted when an ELQ element has changed size.
* `breakpointStatesChanged(element, breakpointStates)`: Emitted when an element has changed breakpoint states (e.g., when the width of an element changed from being narrower than a breakpoint to being wider).

### Flow

There are two main flows of the ELQ system; activating an element and updating an element.
When ELQ is requested to activate an element, the following flow occurs:

1. The element is initialized by installing properties and a system handling listeners.s
2. The `getElements` method of all plugins is called to retrieve any additional elements to activate. Additional elements will go through an own flow.
3. The `activate` method of all plugins is called so that plugin specific initialized may occur.
4. If any plugin has requested ELQ to detect resize events of the element, an resize detector is installed.
5. The element is passed through the update flow.

The update flow is as follows:

1. The `getBreakpoints` method of all plugins is called to retrieve all breakpoints of the element.
2. Breakpoint states are calculated.
3. If any state has changed since the previous update:
4. If any state has changed since the previous update:
    1. Cycle detection is performed.
    2. The `applyBreakpoints` method of all plugins is called.
    3. The `breakpointStatesChanged` event is emitted.

Of course, there are options to disable some of the steps such as cycle detection and applying breakpoints.
In addition to being triggered by the start flow and plugins, it is also triggered by element resize events.

### Example Plugin Implementation
The API that enables developers to annotate breakpoints in HTML, as described in the usage section, is implemented as two plugins. One plugin parses the breakpoints of the element attributes and one plugin applies the breakpoint classes. The simplified code of the `make` method of the parsing plugin is as following:

```js
function activate(element) {
  if (!element.hasAttribute("elq-breakpoints")) {
    return;
  }

  element.elq.resizeDetection = true;
  element.elq.updateBreakpoints = true;
  element.elq.applyBreakpoints = true;
  element.elq.cycleCheck = true;
}

function getBreakpoints(element) {
  return ...
}

// Return the plugin API
return {
  activate: activate,
  getBreakpoints: getBreakpoints
};
```

The applying plugin simply implements the `applyBreakpoints` method to alter the `className` property of the element by the given breakpoint states.
