const { trace, context, SpanStatusCode, propagation, metrics } = require("@opentelemetry/api");
require("@opentelemetry/tracing");
const { spawnSync } = require('child_process');
const bcrypt = require("bcryptjs")
let tracer = trace.getTracer("");
const myMeter = metrics.getMeter(
  'my-service-meter'
);
const counter = myMeter.createCounter('num_traces.counter');
function doWork(wait_time) {
    // mock some work by sleeping
    return new Promise((resolve, reject) => {
        setTimeout(resolve, wait_time);
    })
}
function fetchData(x) {
    // mock some work by sleeping
    return new Promise(resolve => {
        setTimeout(() => {
          resolve(x);
        }, 2000);
      });
}
class DownstreamClass2 {
    constructor() {
        this.tracer = trace.getTracer("TracingExample", process.env.npm_package_version);
    }
    async contextDownStream() {
        let span = this.tracer.startSpan("context-downstream-2");
        await doWork(500);
        span.end();
    }
    async baggageDownStream() {
        let span = this.tracer.startSpan("baggage-downstream-2");
        await doWork(500);
        span.end();
    }

}
class DownstreamClass {
    constructor() {
        this.tracer = trace.getTracer("TracingExample", process.env.npm_package_version);
    }
    async doWorkTo() {
        let pctx = context.active();
        let span = this.tracer.startSpan("do-work-to");
        span.setAttribute("propagate", pctx.getValue("propagate"));
        
        await doWork(500);
        span.end();
    }
    async contextDownStream() {
        let span = this.tracer.startSpan("context-downstream");
        context.with(trace.setSpan(context.active(), span), async () => {
            await doWork(500);
            let downstream = new DownstreamClass2();
            await downstream.contextDownStream();
            span.end();
        });
    }
    async baggageDownStream() {
        let span = this.tracer.startSpan("baggage-downstream");
        context.with(trace.setSpan(context.active(), span), async () => {
            await doWork(500);
            let downstream = new DownstreamClass2();
            await downstream.baggageDownStream();
            span.end();
        });
    }

}
class TracingExample {
    constructor() {
        this.tracer = trace.getTracer("TracingExample", process.env.npm_package_version);
    }
    async contextProcessorExample() {
        //name of span and the span options 
        let span = this.tracer.startSpan("call-context-downstream", { root: true });
        let ctx = context.active();
        let newctx = ctx.setValue("context", "from-parent");
        //WE HAVE TO save to self

        span.setAttribute("context", "from-parent");
        context.with(trace.setSpan(newctx, span), async () => {
            await doWork(500);
            let downstream = new DownstreamClass();
            await downstream.contextDownStream();
            span.end();
        });
    }

    async baggageExample() {
        let span = this.tracer.startSpan("call-baggage-downstream", { root: true });
        let ctx = context.active();
        const baggage = propagation.getBaggage(ctx) || propagation.createBaggage();
        const updatedBaggage = baggage.setEntry("baggage", { value: "from-parent" });
        //WE HAVE TO save to self
        span.setAttribute("baggage", "from-parent");
        const newContext = propagation.setBaggage(ctx, updatedBaggage);
        context.with(trace.setSpan(newContext, span), async () => {

            await doWork(500);
            let downstream = new DownstreamClass();
            await downstream.baggageDownStream();
            span.end();
        });
    }

    async bcryptExample(rounds) {
        let span = this.tracer.startSpan("hash-rounds", { root: true });

        const hashRounds = rounds || 10 // The more hash rounds the longer hashing takes
        bcrypt.hash("hash me!", hashRounds, () => {
            console.log(`--------- Hashing took finished for ${hashRounds} rounds ---------`)
            // setTimeout(hash)
            span.end();
        });
        
      
    }
    async spawnSyncExample() {
        setImmediate(() => {
            spawnSync('sleep', ['5']);
          });
    }
    //create a trace  span
    async callDownstream() {
        //name of span and the span options 
        let span = this.tracer.startSpan("call-downstream", { root: true });
        let ctx = context.active();
        let newctx = ctx.setValue("propagate", "value");
        context.with(trace.setSpan(newctx, span), async () => {
            span.setAttribute("propagate", "value");
            await doWork(500);
            let downstream = new DownstreamClass();
            await downstream.doWorkTo();
            span.end();
        });
    }
 
    //create a trace  span
    async createNewTrace() {
        //name of span and the span options 
        let span = this.tracer.startSpan("new-trace", { root: true });
        counter.add(1);
        await doWork(1000);
        span.end();
    }

    //Add Attributes to a span
    async spanAttributes() {
        //can create attributes on start
        let start_attr_map = { "start_str": "start", "start_num": 0, "start_bool": false };
        let span = this.tracer.startSpan("span-attributes", { attributes: start_attr_map, root: true });
        await doWork(1000);
        //or add later 
        let end_attr_map = { "end_str": "end", "end_num": 1, "end_bool": true };
        span.setAttributes(end_attr_map);

        //or indivdiually 
        span.setAttribute("single_attr", 1);
        span.end();

    }

    // Add a new span to the existing trace
    async addToExistingTrace() {
        //name of span
        let span = this.tracer.startSpan("add-to-existing-trace");
        await doWork(1000);
        span.end();
    }

    //Get the current span in context and add attribute
    async addToCurrentSpan() {
        const span = trace.getSpan(context.active());
        span.setAttribute('foo', 'bar');
    }
    //Add events to a span
    async spanEvent() {
        let span = this.tracer.startSpan("span-event", { root: true });
        //name of span and span attributes
        span.addEvent("Start of Work", { foo: 'start' });
        await doWork(500);
        span.addEvent("Middle of Work", { foo: 'mid' });
        await doWork(500);
        span.addEvent("Finished Work", { foo: 'end' });
        span.end();
    }

    // Add Error to a span and set to error state
    async spanError() {
        let span = this.tracer.startSpan("span-error", { root: true });
        //name of span and span attributes
        await doWork(500);
        try {

        } catch (err) {
            span.recordException(err);
        }
        span.recordException({ message: 'Custom Error'});
        span.setStatus({ code: SpanStatusCode.ERROR })
        span.end();
    }

    // Add links to a span
    async spanLinks() {
        let many_links = []


        tracer.startActiveSpan('root', async (root) => {
            let root_context = root.spanContext();
            for (let i = 0; i < 3; i++) {
                let many_span = this.tracer.startSpan("many-to-1", { attributes: { many_number: i }, links: [{ context:root_context  }], root: true });
                many_links.push({ context: many_span.spanContext() });
                await doWork(50);
                many_span.end();
    
            }
            let the_one_span = this.tracer.startSpan("the-one", { links: many_links });
            await doWork(50);
            the_one_span.end();
            root.end();

        });

    }
    async workerJobs() {
        /* Have a worker span that does track each child jobs duration, but link to the children in a separate trace as to not clutter the UI */
        let worker = this.tracer.startSpan("worker", { root: true });
        const example = this;
        context.with(trace.setSpan(context.active(), worker), async () => {
            for (let i = 0; i < 3; i++) {
                async function doJob() {
                    // now returns the bake-cake span
                    let job_trace = example.tracer.startSpan("job", { attributes: { job_id: i }, root: true });
                    let link = [{ context: job_trace.spanContext() }];
                    let job_span = example.tracer.startSpan("job", { attributes: { job_id: i }, links: link });
                    context.with(trace.setSpan(context.active(), job_trace), async () => {
                        // now returns the bake-cake span
                        await doWork(50);
                        let child_job = example.tracer.startSpan("job-child");
                        await doWork(50);
                        child_job.end();

                    }).then(() => {
                        job_trace.end();
                        job_span.end();
                        
                    });
                }
                await doJob()

            }
        }).then(() => {
            worker.end();
        });
    }

    async rollUpSpan() {
        //Start trace
        let parent = this.tracer.startSpan("roll-up-start", { root: true });

        context.with(trace.setSpan(context.active(), parent), async () => {
            //Create an aggregate
            let rollup = {
                min: 0,
                max: 0,
                avg: 0,
                total_count: 0
            }
            let dur = 0;

            // span for saving aggregate attributes
            let rollup_span = this.tracer.startSpan("rollup", { attributes: rollup });
            context.with(trace.setSpan(context.active(), rollup_span), async () => {
                for (let i = 1; i < 4; i++) {
                    let timer = Math.pow(10, i);
                    //This work will be what we want to roll up and not record
                    await doWork(timer);

                    // keep track of aggregate for saving alter
                    if (rollup.total_count == 0) {
                        dur += timer;
                        rollup.total_count++;
                        rollup.min = dur;
                        rollup.max = dur;
                        rollup.avg = dur;

                    } else {
                        dur += timer;
                        rollup.total_count++;
                        if (dur < rollup.min) rollup.min = dur;
                        if (dur > rollup.max) rollup.max = dur;
                        rollup.avg = dur / rollup.total_count;
                    }
                }

                // save aggregates to span
                rollup_span.setAttributes(rollup);
                rollup_span.end();
                parent.end();
            });
        });
    }

    //Get the current span in context and add attribute
    async init() {
        let activeSpan = this.tracer.startSpan("init");
        activeSpan.setAttribute('foo', 'myattributes');

        let data = await fetchData();

        activeSpan.setAttribute('dataRows', data.length);
        activeSpan.end();
    }

}



module.exports = TracingExample;