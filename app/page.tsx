"use client";

import CastleExplorerPlayer, { Clip } from "@/components/CastleExplorerPlayer";

const playlist: Clip[] = [
  { id: "ext-01", title: "Misty Dawn Flyover", src: "/media/opening-mist.mp4", poster: "/media/opening-mist.jpg",
    ctas: [{ label: "Enter the gatehouse", goTo: "autoNext" }] },
  { id: "gate-02", title: "Gatehouse Approach", src: "/media/gatehouse.mp4", poster: "/media/gatehouse.jpg",
    ctas: [{ label: "Explore the armoury", goTo: "arm-03" }, { label: "Descend to the dungeon", goTo: "dun-04" }] },
  { id: "arm-03", title: "Armoury Discovery", src: "/media/armoury.mp4", poster: "/media/armoury.jpg",
    ctas: [{ label: "go to dungeon", goTo: "dun-04" }] },
{ id: "dun-04", title: "Dungeon Descent", src: "/media/dungeon.mp4", poster: "/media/dungeon.jpg",
  ctas: [{ label: "Finish", goTo: "home" }] },
];

export default function Page() {
  return <CastleExplorerPlayer title="Castle Explorer" playlist={playlist} showBar={true} />;
}
