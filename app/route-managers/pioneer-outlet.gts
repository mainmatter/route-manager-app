import type { TOC } from '@ember/component/template-only';
import type { RouteComponent } from 'use-route-manager/route-managers/pioneer-manager';

interface OutletBucket {
  loadingState: RouteComponent | undefined;
}

interface PioneerOutletSignature {
  Args: {
    Component: RouteComponent | undefined;
    bucket: OutletBucket;
    context: unknown;
    outlet: unknown;
  };
}

export const PioneerOutlet: TOC<PioneerOutletSignature> = <template>
  {{! @Component is prescribed by the route-manager contract. }}
  {{! template-lint-disable no-capital-arguments }}
  {{#if @Component}}
    <@Component @context={{@context}} @outlet={{@outlet}} />
  {{else if @bucket.loadingState}}
    <@bucket.loadingState @context={{@context}} @outlet={{@outlet}} />
  {{/if}}
</template>;
