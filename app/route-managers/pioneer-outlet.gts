import type { TOC } from '@ember/component/template-only';
import type { RouteBucket } from 'use-route-manager/route-managers/pioneer-manager';

interface PioneerOutletSignature {
  Args: {
    bucket: RouteBucket;
    context: unknown;
    outlet: unknown;
  };
}

/**
 * The wrapper this manager renders every one of its routes through.
 *
 * Module-stable per RFC-1169: the framework curries this level's state onto it
 * as `@Component` (the invokable), `@context`, `@bucket` and `@outlet`, so an
 * ordinary component is enough — no component manager, no references, nothing
 * to curry. The context is handed down; it is never read off `@bucket`.
 *
 * It deliberately renders `@bucket.renderable` rather than `@Component`:
 * `renderable` returns the `LoadingState` while the route module is still in
 * flight, whereas `@Component` is always the final invokable. Collapsing them
 * would discard this manager's loading policy.
 */
export const PioneerOutlet: TOC<PioneerOutletSignature> = <template>
  {{#if @bucket.renderable}}
    <@bucket.renderable @context={{@context}} @outlet={{@outlet}} />
  {{/if}}
</template>;
