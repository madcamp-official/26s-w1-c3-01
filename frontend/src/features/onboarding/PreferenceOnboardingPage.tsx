import { AllergyStep } from "./AllergyStep";
import { CategoryPreferenceStep } from "./CategoryPreferenceStep";
import { MenuPreferenceStep } from "./MenuPreferenceStep";
import { TagPreferenceStep } from "./TagPreferenceStep";

export function PreferenceOnboardingPage() {
  return (
    <section>
      <h1>선호도 온보딩</h1>
      <MenuPreferenceStep />
      <CategoryPreferenceStep />
      <TagPreferenceStep />
      <AllergyStep />
    </section>
  );
}
