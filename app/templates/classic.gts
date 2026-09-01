import type { TOC } from '@ember/component/template-only';

interface ClassicTemplateSignature {
  Args: {
    controller: object;
    model: { name: string };
  };
}

const ClassicTemplate: TOC<ClassicTemplateSignature> = <template>
  <div class="classic" data-test-route-level="classic">
    <h2>Hello from a Classic Route!</h2>
    <p>Zebra striping of route managers works!</p>

    <p>Model data is passed in as expected: {{JSON.stringify @model}}</p>
    <p>Model properties are accessible: {{@model.name}}</p>
    <p>Has a generated controller: {{if @controller "Yes" "No"}}</p>

    {{outlet}}
  </div>
</template>;

export default ClassicTemplate;
