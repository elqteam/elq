# elq
Element queries framework. Solution to modular responsive components.

## Why Element Queries?

## Why ELQ?

Since element queries have not been standardized (and also not implemented in browsers), developers need to resort to JavaScript libraries to provide element queries.
There are numerous JavaScript libraries that enable element queries in different ways, but here are the main selling points to why we believe ELQ is the best library:

* ELQ is plugin-based which means that different plugins may be developed for different use cases without bloating the library API or decreasing the overall performance.
* The performance of ELQ is outstanding compared to related libraries. This has been achieved by using a custom-built leveled batch processor.
* The detection system is fully automatic in the sense that element queries will be reavaluted once an element has changed size (without using polling!).
* ELQ is compatible with IE8+.
* Numerous bugs and issues have been resolved that are still present in related libraries.
* The standard plugins of ELQ enables advanced element queries (that go beyond the capabilities of CSS) without requiring invalid syntax.

Read the Master's Thesis for more details.

