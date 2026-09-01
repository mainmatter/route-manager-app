import type { TOC } from '@ember/component/template-only';
import type { RouteComponent } from 'use-route-manager/route-managers/pioneer-manager';

interface PioneerOutletSignature {
  Args: {
    Component: RouteComponent;
    context: unknown;
    outlet: unknown;
  };
}

export const PioneerOutlet: TOC<PioneerOutletSignature> = <template>
  {{! @Component is prescribed by the route-manager contract. }}
  {{! template-lint-disable no-capital-arguments }}
  <@Component @context={{@context}} @outlet={{@outlet}} />
</template>;
