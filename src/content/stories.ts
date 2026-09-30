import type { Story } from "@/db/schema";

export type StorySeed = Omit<Story, "id" | "publishedAt" | "createdAt"> & { daysAgo: number };

/**
 * Seed dispatches. Inserted into the database on first run (never overwritten).
 * Tone: operational, specific, written from the site — not marketing.
 */
export const storySeeds: StorySeed[] = [
  {
    slug: "building-a-resort-without-a-road",
    dispatchNo: 47,
    title: "Building a Resort Without a Road",
    dek: "Every bag of cement, every solar panel, every nail came in on a bangka at high tide. Here’s what that does to a schedule, a budget, and the way you think about building.",
    category: "Field Ops",
    location: "Site 01 · Northern Palawan",
    readingMinutes: 11,
    coverImage: "/images/story-no-road.jpg",
    coverAlt: "Workers unloading cargo from a boat across a wooden plank at first light",
    featured: true,
    daysAgo: 3,
    body: [
      {
        type: "p",
        text: "The site is forty minutes by boat from the nearest town with a hardware store, and there is no road. There’s a footpath over the ridge that locals use in the dry season, and there’s the sea. That’s it. So everything — 1,400 bags of cement, 36 solar panels, a 48 kWh battery bank, two tonnes of rebar, the crew, their rice — came in by bangka.",
      },
      {
        type: "p",
        text: "People hear “no road” and think it’s a romantic detail. It isn’t. It’s the single variable that controls everything else: what you can build, when you can build it, what it costs, and who you can hire.",
      },
      { type: "h2", text: "The tide is the project manager" },
      {
        type: "p",
        text: "Our landing beach is only usable for about three hours either side of high tide. At low tide, 200 metres of reef flat stand between the boat and the sand. So the logistics calendar isn’t set by us. It’s set by the tide table — and by the wind. From June to October the habagat makes the approach rough most afternoons, so heavy runs happen between November and May and every monsoon-season delivery is treated as optional.",
      },
      {
        type: "log",
        title: "Boat run 07",
        entries: [
          { time: "05:40", text: "Loaded at the pier: 80 bags of cement, 12 panels, 6 lengths of 2-inch GI pipe." },
          { time: "06:15", text: "Departed. Swell half a metre to a metre. Fine." },
          { time: "07:02", text: "Arrived on high water. Crew of nine unloading by hand along the plank." },
          { time: "08:30", text: "Last bags up the beach. Three bags wet — used for footings the same day." },
          { time: "09:10", text: "Tide turning. Boat out before the reef flat drains." },
        ],
      },
      { type: "h2", text: "What “no road” actually costs" },
      {
        type: "p",
        text: "Landed on site, materials cost us roughly 35–40% more than the same items in town. Not because of fuel — because of handling. Every item gets touched six or seven times: truck to pier, pier to boat, boat to plank, plank to beach, beach to stockpile, stockpile to the build. Breakage and water damage are budget lines, not accidents.",
      },
      {
        type: "list",
        items: [
          "Cement: bought in batches of 80 bags, maximum. That’s what one boat carries without sitting dangerously low.",
          "Solar panels: two people per panel, never stacked on deck. We lost one to a wave on run four.",
          "Steel: cut to length in town. Nothing longer than six metres goes on the boat.",
          "Water: never shipped. Rain catchment went in before the first roof was finished.",
        ],
      },
      {
        type: "quote",
        text: "No road means you design for what two people can carry up a beach at 7 a.m. That constraint made the buildings better.",
        cite: "Site notebook, month three",
      },
      { type: "h2", text: "Design follows logistics" },
      {
        type: "p",
        text: "We stopped designing on paper and started designing around the boat. Modular timber frames in four-metre lengths. Bamboo from the next cove over. Roof pitches steep enough to shed a typhoon’s worth of rain straight into the tanks. The architecture looks “organic”, but most of it is just an honest answer to one question: how does this get here?",
      },
      {
        type: "callout",
        label: "What we’d do differently",
        text: "Build the landing first. We spent the first two months fighting the beach. A simple stone ramp and a hand winch would have paid for themselves in three weeks.",
      },
      {
        type: "p",
        text: "Next dispatch: the water system — why the tanks went in before the villas, and what happened the first time the pump failed with guests on site.",
      },
    ],
  },
  {
    slug: "why-local-businesses-fail-with-tech",
    dispatchNo: 46,
    title: "Why Local Businesses Fail with Tech (and How We Fix It)",
    dek: "It’s almost never the software. It’s that nobody designed for a two-person business running on one shared Android phone and prepaid data.",
    category: "Automation",
    location: "Puerto Princesa",
    readingMinutes: 8,
    coverImage: "/images/story-local-tech.jpg",
    coverAlt: "A young vendor at a market stall",
    featured: false,
    daysAgo: 10,
    body: [
      {
        type: "p",
        text: "In the last year we’ve set up booking and messaging systems for eleven local businesses — a dive shop, three guesthouses, two van operators, a bakery, a laundry, a boat-tour cooperative and two restaurants. Before we arrived, eight of them had already paid for software. None of it was being used.",
      },
      { type: "h2", text: "The failure pattern" },
      {
        type: "list",
        items: [
          "The tool assumes a laptop. The business runs on one shared Android phone.",
          "The tool assumes stable internet. The business has prepaid data that runs out around the 20th.",
          "The tool assumes email and an English interface. The customers are on WhatsApp and Messenger, writing in Tagalog, Cebuano and English — sometimes in one message.",
          "The tool assumes someone will “manage” it. There is no someone. The owner is also the cook.",
        ],
      },
      { type: "quote", text: "If the system needs a champion to survive, it won’t survive." },
      { type: "h2", text: "What we do instead" },
      {
        type: "p",
        text: "We start where the business already is: the chat. Customers message on WhatsApp; an agent answers availability and prices, collects the details and drafts the booking. The owner gets a single message with two options: approve or change. The deposit goes out as a GCash link. The booking lands in a shared sheet the owner already understands.",
      },
      {
        type: "callout",
        label: "The rule we follow",
        text: "Nothing reaches a customer that a human hasn’t approved — until the owner tells us otherwise. Most do, after about six weeks.",
      },
      {
        type: "p",
        text: "The results are unglamorous: fewer missed messages at night, no double-booked vans, deposits collected before the customer “thinks about it”. One guesthouse went from answering fewer than half of its late-night inquiries to answering all of them. That’s the whole pitch.",
      },
    ],
  },
  {
    slug: "what-actually-breaks-off-grid",
    dispatchNo: 45,
    title: "What Actually Breaks When You Go Off-Grid",
    dek: "Not the solar panels. A running list of the failures that actually took us offline — and the boring fixes that kept us online after.",
    category: "Infrastructure",
    location: "Site 01 · Northern Palawan",
    readingMinutes: 9,
    coverImage: "/images/story-off-grid.jpg",
    coverAlt: "An electrician wiring a solar power system",
    featured: false,
    daysAgo: 17,
    body: [
      {
        type: "p",
        text: "Everyone worries about the panels. The panels are fine. In eighteen months they’ve been the most reliable thing on site. Here’s what actually broke.",
      },
      { type: "h2", text: "The failure log" },
      {
        type: "log",
        title: "Failures, months 1–18",
        entries: [
          { time: "Month 2", text: "Inverter shut down at 2 a.m. — high-temperature fault. It was mounted in a sealed room with no airflow. Moved it, added a vent. Never again." },
          { time: "Month 4", text: "Pump controller fried by a lightning strike across the bay. No surge protection on the pump line. Two days of carrying water by bucket." },
          { time: "Month 7", text: "Salt corrosion on every exposed connector within 200 m of the sea. Replaced with tinned copper and heat-shrink on everything." },
          { time: "Month 9", text: "Battery monitor reported 60%. Batteries were actually at 20%. The shunt had drifted. Guests had cold showers." },
          { time: "Month 13", text: "Ants nested in the charge controller. Genuinely. Sealed every cable entry with putty." },
        ],
      },
      { type: "quote", text: "Off-grid doesn’t fail dramatically. It fails at the connectors, at night, when it’s raining." },
      { type: "h2", text: "What we changed" },
      {
        type: "list",
        items: [
          "Everything electrical gets airflow, a drip loop and a roof over it.",
          "Surge protection on every line that leaves a building — power, pump and data.",
          "A second, independent battery reading. We don’t trust a single number anymore.",
          "A monthly “walk the wire” inspection with a checklist. Boring. Works.",
          "Spares on site for anything that takes more than a day to ship: fuses, a pump controller, MC4 connectors, one inverter.",
        ],
      },
      {
        type: "p",
        text: "The power system now reports into the same agent layer that runs guest messaging, so a battery dropping below threshold at 3 a.m. becomes a WhatsApp message to the caretaker — not a surprise at breakfast.",
      },
    ],
  },
  {
    slug: "ai-agents-unstable-internet",
    dispatchNo: 44,
    title: "Deploying AI Agents in a Province with Unstable Internet",
    dek: "Our agents assume the connection will drop. Here’s the architecture that lets them queue, retry, and still hand every message to a human on time.",
    category: "Agents",
    location: "El Nido · Remote",
    readingMinutes: 10,
    coverImage: "/images/story-agents.jpg",
    coverAlt: "A bamboo hut in dense tropical greenery",
    featured: false,
    daysAgo: 24,
    body: [
      {
        type: "p",
        text: "The first agent we deployed assumed it was always online. It answered beautifully — until a squall knocked out the uplink for forty minutes and nine guest messages sat unanswered, with no record of what had been promised.",
      },
      { type: "h2", text: "Design for the drop" },
      {
        type: "list",
        items: [
          "Every inbound message is written to a local queue first, then processed. If the uplink drops, nothing is lost.",
          "Agents never confirm a booking or a payment on their own. They draft; a human approves from their phone with one tap.",
          "Two uplinks: satellite as primary, a 4G router on a different network as failover. The switch is automatic and the agent doesn’t care which one it’s on.",
          "When both are down, the caretaker has a printed fallback: prices, availability rules and the boatman’s number.",
        ],
      },
      {
        type: "log",
        title: "Squall, 14:02–14:51",
        entries: [
          { time: "14:02", text: "Satellite obstruction — heavy rain cell. Failover to 4G." },
          { time: "14:09", text: "4G degraded. 3 messages queued." },
          { time: "14:44", text: "Uplink restored. Queue flushed: 9 replies sent, 2 flagged for human approval." },
          { time: "14:51", text: "Owner approved both from the back of a tricycle." },
        ],
      },
      { type: "quote", text: "An agent that can’t admit it’s offline is worse than no agent." },
      { type: "h2", text: "What the agents actually do" },
      {
        type: "p",
        text: "Mostly unglamorous work: answering “is there availability on the 14th?” at 11 p.m., collecting passport names for boat manifests, reminding guests that pickup time depends on the tide, chasing deposits politely. The value isn’t intelligence. It’s that nothing falls through the cracks while the humans are asleep, at sea or out of signal.",
      },
    ],
  },
  {
    slug: "habagat-systems-test",
    dispatchNo: 43,
    title: "The Habagat Is a Systems Test",
    dek: "Every June the southwest monsoon arrives and audits everything we built in the dry season. This year’s results.",
    category: "Field Ops",
    location: "Site 01 · Northern Palawan",
    readingMinutes: 7,
    coverImage: "/images/story-habagat.jpg",
    coverAlt: "Palm trees bending in strong wind over a stormy sea",
    featured: false,
    daysAgo: 31,
    body: [
      {
        type: "p",
        text: "From roughly June to October the habagat brings wind, swell and days of rain in a row. Boats stop. Solar drops to a third. Every shortcut you took in March shows up in August.",
      },
      { type: "h2", text: "This season’s audit" },
      {
        type: "list",
        items: [
          "Solar yield: down to 30–40% on the worst weeks. The generator ran 11 hours all season — down from 60 last year, after we added battery capacity.",
          "Water: tanks full by week two. The problem was never supply; it was a gutter overflowing onto the kitchen path.",
          "Logistics: 9 of 14 planned boat runs cancelled. We’d pre-stocked for six weeks. We needed seven.",
          "Crew: two roof-leak call-outs, one coconut tree across the footpath, zero injuries.",
        ],
      },
      { type: "quote", text: "Build in the dry season like you’re already in the wet one." },
      {
        type: "callout",
        label: "Next year",
        text: "Eight weeks of pre-stock, not six. A second covered workspace so the crew can keep working when it pours. And a proper tree survey before the rains, not after.",
      },
    ],
  },
  {
    slug: "the-crew-is-the-infrastructure",
    dispatchNo: 42,
    title: "The Crew Is the Infrastructure",
    dek: "Solar and software get the attention. What actually keeps a remote site running is nine people from the next barangay who know how the sea behaves.",
    category: "People",
    location: "Northern Palawan",
    readingMinutes: 6,
    coverImage: "/images/story-crew.jpg",
    coverAlt: "Two workers carrying a timber beam over rough ground",
    featured: false,
    daysAgo: 38,
    body: [
      {
        type: "p",
        text: "Our crew is mostly from two families in the nearest barangay. The foreman has built houses on this coast for twenty years. He reads the weather better than any app we’ve tried, and he’s usually right about the boat before the boatman is.",
      },
      { type: "h2", text: "What we’ve learned building with locals" },
      {
        type: "list",
        items: [
          "Pay on time, every time — in cash if that’s what people want. Reliability is earned in weeks and lost in a day.",
          "Train people on the systems they’ll maintain. The caretaker can now swap a fuse, reset the inverter and read the battery monitor.",
          "Hire for judgment, not just skill. The best calls on site were made by people who’ve lived through typhoons here.",
          "Document in the language people use. Our maintenance checklists are in Tagalog, with photos.",
        ],
      },
      { type: "quote", text: "Automation doesn’t replace the crew. It gives them their evenings back." },
      {
        type: "p",
        text: "Every system we build is designed so that someone who lives here can run it, fix it and eventually own it. That’s the part of “sustainable” nobody puts on the brochure.",
      },
    ],
  },
  {
    slug: "bangka-logistics-as-a-system",
    dispatchNo: 41,
    title: "Scheduling Around the Tide: Bangka Logistics as a System",
    dek: "We tried a logistics app. Then we built a WhatsApp flow around the boatman’s tide table. Guess which one works.",
    category: "Logistics",
    location: "Taytay → Site 01",
    readingMinutes: 7,
    coverImage: "/images/story-bangka.jpg",
    coverAlt: "Aerial view of an outrigger bangka crossing open water",
    featured: false,
    daysAgo: 45,
    body: [
      {
        type: "p",
        text: "Boat transfers are the arteries of everything we do: materials, crew, food, guests. For the first year, coordination lived in the boatman’s head and in forty WhatsApp threads.",
      },
      { type: "h2", text: "The system now" },
      {
        type: "list",
        items: [
          "Tide and wind forecasts are pulled every morning; unsafe windows are blocked automatically.",
          "Requests — cargo, crew, guests — go into one queue through a WhatsApp flow. Any language, voice notes allowed.",
          "The boatman gets one message the evening before: departure time, manifest, cargo list. He replies “OK” or proposes another time.",
          "Guests get their pickup time the evening before, with a reminder that island time is set by the tide, not by us.",
        ],
      },
      {
        type: "quote",
        text: "The best logistics system in Palawan is still a man with a boat who answers his phone. We just made sure he never gets forty messages.",
      },
      {
        type: "p",
        text: "Next: extending the same flow to two other resorts on the coast so they can share runs. Half-empty boats are the most expensive thing in the province.",
      },
    ],
  },
];
