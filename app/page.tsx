"use client";

import CastleExplorerPlayer, { Clip } from "@/components/CastleExplorerPlayer";

const playlist: Clip[] = [
  { id: "ext-01", title: "Misty Dawn Flyover", src: "/media/opening-mist.mp4", poster: "/media/opening-mist.jpg",
    ctas: [{ label: "Enter the gatehouse", goTo: "autoNext" }],
    facts: [
      "Castles were often sited on high ground for visibility and defense.",
      "Morning mist could conceal troop movement during dawn watches.",
    ] },
  { id: "gate-02", title: "Gatehouse Approach", src: "/media/gatehouse.mp4", poster: "/media/gatehouse.jpg",
    ctas: [{ label: "Enter the courtyard", goTo: "crt-03" }],
    facts: [
      "By the fourteenth century the gatehouse functioned like a small fortress with multiple doors, portcullises and guard rooms.",
      "The ceiling of the passage contained openings called murder holes that allowed defenders to drop boiling water, sand or stones on attackers.",
      "The upper floors often housed living quarters for the constable or gatekeeper who watched over the entrance.",
    ] },
  { id: "crt-03", title: "Courtyard", src: "/media/courtyard.mp4", poster: "/media/courtyard.jpg",
    ctas: [
      { label: "Explore the armoury", goTo: "arm-04" },
      { label: "Descend to the dungeon", goTo: "dun-05" },
    ],
    facts: [
      "The courtyard or bailey was the working heart of the castle where supplies were stored and daily tasks carried out.",
      "It often contained stables, workshops, and entrances to key areas such as the armoury or kitchens.",
      "A central well provided water for both the household and defence during sieges.",
    ] },
  { id: "arm-04", title: "Armoury Discovery", src: "/media/armoury.mp4", poster: "/media/armoury.jpg",
    ctas: [{ label: "go to dungeon", goTo: "dun-05" }],
    facts: [
      "The armoury stored weapons for the garrison including spears, crossbows, shields and suits of mail.",
      "Surviving records show that some armouries contained vast supplies such as hundreds of thousands of arrows.",
      "By the late fourteenth century gunpowder weapons such as small bombards were sometimes kept alongside traditional arms.",
    ] },
{ id: "dun-05", title: "Dungeon Passage", src: "/media/dungeon.mp4", poster: "/media/dungeon.jpg",
  ctas: [{ label: "Finish", goTo: "home" }],
  facts: [
    "Medieval prison passages were designed to intimidate with darkness, damp air and cramped conditions.",
    "Some castles contained vertical shafts known as oubliettes where prisoners were lowered and abandoned.",
    "Captives were often nobles held for ransom or offenders awaiting judgement rather than long term inmates.",
  ],
  modal: {
    title: "Why nobles were spared: the practice of ransom",
    linkText: "Why did nobles rarely fear battle in the 14th century?",
    body:
      "**Why nobles were spared: the practice of ransom**\n\n" +
      "Nobles in the fourteenth century rarely feared for their lives in battle. If they were captured, they could expect to be spared. This was not out of mercy, but because their ransom could bring wealth and influence.\n\n" +
      "*What every fighter understood*\n\n" +
      "To kill a noble was to throw away a prize. To take him captive was to secure silver, land, or patronage.\n\n" +
      "The ransom custom created an unspoken code. Nobles spared one another, knowing that next time the roles might be reversed.\n\n" +
      "Captured nobles often gave their word of honour to pay, and in many cases were even released on trust until the ransom was gathered.\n\n" +
      "*The scale of ransom*\n\n" +
      "The sums could be immense. A knight might fetch more than a lifetime of wages for an ordinary man at arms. Great lords commanded fortunes. When King John of France was taken at Poitiers in 1356, the ransom demanded was so large it reshaped the politics of Europe.\n\n" +
      "*The reality of war*\n\n" +
      "This practice meant that nobles often walked into battle with a sense of security unknown to the common soldier. For the rank and file, defeat could mean death. For the noble, defeat could mean a period in captivity, followed by release in exchange for gold.",
  } },
];

export default function Page() {
  return <CastleExplorerPlayer title="Castle Explorer" playlist={playlist} showBar={true} />;
}
