# elq
Element queries framework. Solution to modular responsive components.

**ELQ currently is in early beta.** Therefore, bugs and API changes may occur frequently. We really appreciate feedback such as GitHub issues and pull requests.

## Why Element Queries?

Element queries are not for the faint hearted (read: not suitable for all projects).
If your web app consists of modules that are (or should be) responsive --- then this is most probably something for you!
Otherwise, move on and come back another time :)

## Why ELQ?

Since element queries have not been standardized (and also not implemented in browsers), developers need to resort to JavaScript libraries to provide element queries.
There are numerous JavaScript libraries that enable element queries in different ways, but here are the main selling points to why we believe ELQ is the best solution:

- Extensibility through plugins
- Super-fast element resize detection
- batch processed updates of elements breakpoint states (to avoid layout thrashing).
- Compatability with existing code (conforms to HTML, JS and CSS specs).
- Compatability with browsers (IE8+, Opera 12+, etc).
- A runtime cycle detection system
- Allowing style encapsulation of responsive elements (this allows nestable responsive modules).

For a very detailed description of ELQ and element queries, read the Master's Thesis: http://kth.diva-portal.org/smash/get/diva2:850230/FULLTEXT01.pdf
The API and architecture is somewhat outdated, but the Thesis is still relevant for understanding ELQ.

# Docs

Since ELQ is in beta, we haven't had time to write proper docs yet. What follows is really a minimal explenation of the API.

## Usage

Once the ```dist/elq.js``` file is included into the HTML (it is built with UMD, so include it as you wish) it exposes a global function ```Elq```. This is a constructor that creates ELQ instances. It is recommended to only use one instance per application.

```
// Creating an ELQ instance is easy!
var elq = Elq();

// It also accepts an options object.
var elq = Elq({
  cycleDetection: false
});
```

## Architecture & Plugins

One our of contributions is to allow ELQ to be easily extended with plugins. For example, if annotating HTML is undesired it is possible to create a plugin that instead parses CSS. Likewise, if adding breakpoint classes to element is undesired it is possible to create a plugin that does something else when a breakpoint state of an element has changed. In order to enable such powerful behavior alterings by plugins, extensibility has been the main focus when designing the ELQ architecture.

## elq-breakpoints

```
// With default options.
elq.use(elqBreakpoints);

// With custom options.
elq.use(elqBreakpoints, {
  ...
});
```

### Options

#### cycleDetection
Type: `Boolean`  
Default: `true`

When enabled, the cycle detection system tries to detect cyclic rules and breaks them if needed. When a cycle is detected, a console warning is printed. This may be helpful during development to catch cycles.

#### defaultUnit
Type `String`  
Valid values: `"px"` `"em"` `"rem"`  
Default: `"px"`

Sets the default unit for all breakpoints that do not have a unit postfix. For instance, if defaultUnit is set to `"em"`, the breakpoint `300` is interpreted as `300em` while breakpoint `500px` is still interpreted as `500px`.
