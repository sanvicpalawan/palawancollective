import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-24 md:py-32">
      <p className="label-mono text-clay-deep">Error 404 · Signal lost</p>
      <h1 className="mt-4 font-display text-[clamp(6rem,24vw,20rem)] uppercase leading-[0.82]">
        Lost<span className="text-clay">.</span>
      </h1>
      <p className="mt-6 max-w-xl font-serif text-[1.6rem] leading-snug">
        This page dropped off the network. Probably the uplink. Probably.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/">Back to base</ButtonLink>
        <ButtonLink href="/stories" variant="outline">
          Read the Stories
        </ButtonLink>
      </div>
    </Container>
  );
}
