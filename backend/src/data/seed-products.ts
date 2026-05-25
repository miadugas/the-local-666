// Backend-owned product seed data. The local DB is the catalog source of
// truth once seeded; this file only populates an empty table on first boot.
// Regenerated from the live DB (descriptions authored via the admin editor),
// so a fresh deploy reproduces the real catalog. image_url is derived from the
// slug in seed.ts (`/stickers/<slug>.png`).

import type { StripColor } from "@grave-goods/shared";

export type SeedProduct = {
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  accentHex: string;
  description: string | null;
  displayOrder: number;
  isSoldOut: boolean;
  stripLabel: string;
  stripColor: StripColor;
};

export const SEED_PRODUCTS: readonly SeedProduct[] = [
  {
    slug: "protect-trans-kids",
    stripLabel: "Protect",
    stripColor: "pink",
    title:
      '"Protect Trans Kids" A Multi-Headed Dragon On The Right Side Of History Sticker',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#5BCEFA",
    description:
      "You came for the children and woke up the dragon. Several of them, actually. All of them angry. None of them tired.\nThis isn't a debate. It's not a both-sides situation. It's not a political position up for reconsideration every election cycle. These are kids — real ones, with families who love them and futures worth protecting — and the dragon doesn't negotiate.\n\nFor the parents, the allies, the educators, the strangers on the internet who show up anyway. For everyone who decided that \"not my problem\" was never actually an option. For the trans kids themselves, who deserve to see something fierce flying their colors.\nThe opposition has legislation. We have a hydra. Cut one head off and see what happens.\nSlap it somewhere loud. Let it start the conversation, because trans kids don't need your thoughts and prayers — they need a guardian beast with five mouths. This one's not asking nicely and is absolutely not here to debate.\n\nTrans kids exist, trans kids deserve protection, trans kids are not a debate. Slap this on a laptop, a locker, or every door at your kid's school district HQ.\n\nThey are loved. They are protected. The dragon said so.",
    displayOrder: 0,
    isSoldOut: false,
  },
  {
    slug: "cops-arent-your-friends",
    stripLabel: "A.C.A.B.",
    stripColor: "blue",
    title: '"Cops Aren\'t Your Friends" A Cheerful Reminder Sticker',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#2ad6a0",
    description:
      "She's not angry about it. She's not even surprised. She's just laughing because you already knew this and kept forgetting.\nThe bubbly font, the bright colors, the delighted anime girl — because the most unsettling way to say a true thing is to say it like it's obvious. Like you're telling someone the sky is blue. Like you can't believe this is still the conversation we're having.\nThis isn't a threat. It's not even really an argument. It's the friend who's done the reading, watched the footage, talked to the people, and arrived at a conclusion so solid she can deliver it with a smile and a little shrug.\nFor the ones who know. Who've always known. Who are so tired of explaining it that at some point the only reasonable response is to laugh.\nPink and green. Cute as hell. Not kidding even a little.\nSlap this bad boy on your laptop, water bottle, or the back of a cop car if you're feeling bold.\n\nThey're not. They never have been. Stick it somewhere a friendly officer might see it — your bumper, your laptop, the door of the cafe with the 'free coffee for cops' sign.\n\nNot a hot take. Just a warm reminder. 🩷",
    displayOrder: 1,
    isSoldOut: false,
  },
  {
    slug: "you-are-not-immune",
    stripLabel: "Wake up",
    stripColor: "yellow",
    title:
      '"You Are Not Immune To Propaganda" A Junji Ito Public Service Announcement Sticker',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#150b1c",
    description:
      "You're smart. You do your research. You can spot a grift from a mile away — someone else's grift, anyway.\nThat's the thing about propaganda. It doesn't announce itself. It arrives wearing the aesthetic of rebellion, the language of free thought, the vibe of someone who's just asking questions. It finds the part of your brain that wants to feel awake while putting you to sleep.\nThe spiral eyes aren't a warning about other people. They're a mirror.\nThis isn't an accusation. It's a reminder — the kind you stick somewhere you'll see it before you share something, buy something, or decide someone new is the enemy.\nCritical thinking isn't a destination. It's a practice. Daily. Uncomfortable. Especially when the propaganda is coming from inside the house.\n⚠️ Check your sources. ⚠️ Check yourself.\n\nThe scariest horror isn't supernatural. It's a really good algorithm.",
    displayOrder: 2,
    isSoldOut: false,
  },
  {
    slug: "class-consciousness",
    stripLabel: "Class!",
    stripColor: "lime",
    title:
      '"All The Cool Kids Have Class Consciousness" A Retro Radicalization Sticker',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f4ecd8",
    description:
      "Remember when being cool meant knowing the right people? Wearing the right thing? Sitting at the right table?\nTurns out the right table had it coming.\nThis isn't your college professor's political theory. This is a Molotov cocktail and a guillotine fist-bumping in matching sneakers — because understanding who actually owns your labor shouldn't feel like homework. It should feel like finally getting the joke everyone else was too comfortable to explain.\nCute enough to put on your water bottle. Historically significant enough to make your landlord nervous.\nFor the ones who read one (1) thing and never recovered. Who can't watch an earnings call without doing math. Who smile a little too knowingly at the word capital.\nYou didn't radicalize. You just paid attention.\n\nClass consciousness: it's giving vintage. It's giving inevitable.",
    displayOrder: 3,
    isSoldOut: false,
  },
  {
    slug: "follow-your-leader",
    stripLabel: "Obey.",
    stripColor: "pink",
    title: '"Follow Your Leader" An Obedience Study Sticker',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f4ecd8",
    description:
      "They said leadership meant sacrifice. Turns out it meant watching someone drink deeply from power while calling it patriotism — and being asked to applaud.\nThis is for everyone who noticed. Who watched the performance, read the room, and felt something between exhaustion and fury lodge permanently behind their left eye.\nBlind loyalty has a look. It's been on the news. It's at the dinner table. It's got a merch store.\nWoodcut-rough, deliberately ugly, historically accurate. Because some things don't deserve a clean aesthetic.\nStick it somewhere they'll see it. Let the discomfort do the work.\n\nFollow your leader. Or don't. Famously an option.",
    displayOrder: 4,
    isSoldOut: false,
  },
  {
    slug: "devour-feculence",
    stripLabel: "Devour.",
    stripColor: "blue",
    title: '"Devour Feculence" A Milchick Moment Sticker',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#a3e635",
    description:
      'For every time you had to smile through the meeting. For every note you took while someone talked over you. For every moment you used your inside voice when your outside voice had something very specific to say.\nMr. Milchick finally said what we\'ve all been thinking — just with better vocabulary.\nThis is for the overqualified. The underestimated. The ones who read the room, mastered the system, and then, at exactly the right moment, told their boss to eat s**t in a way that required a dictionary.\nWear it loud. Let them Google it.\n\n"Devour Feculence" — Severance, S2E9. Look it up. Then look in the mirror.',
    displayOrder: 5,
    isSoldOut: false,
  },
  {
    slug: "throbbing-middle-finger",
    stripLabel: "Up yours.",
    stripColor: "yellow",
    title: '"Throbbing Middle Finger to God" Fuck Charlie Kirk',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#150b1c",
    description:
      "Charlie Kirk called us a problem. We made it a sticker. This is for the queers, the heretics, the ones who were told they were too much — too loud, too gay, too weird, too alive — for whatever god someone else decided was in charge. We took his words, slapped them in hot pink and trans blue, decorated them with flowers, and stuck them on our water bottles.\nBecause if existing joyfully is an offense to the divine, we'll be offensive with style.\nWear it proud. Stick it everywhere. Let them see it and know — we're not hiding, we're not sorry, and we're having a much better time than they are.\nToo blessed to be their kind of saved.",
    displayOrder: 6,
    isSoldOut: false,
  },
  {
    slug: "deny-defend-depose",
    stripLabel: "Deny.",
    stripColor: "lime",
    title: '"Deny. Defend. Depose." A Healthcare Bouquet Sticker',
    spec: '2.5" x 2.5" die-cut vinyl',
    priceCents: 400,
    accentHex: "#a8c8f0",
    description:
      "Three words the insurance industry taught us. We just rearranged the target.\n\nThey denied your claim. They defended the policy. They deposited the bonus. And somewhere along the way, the language of corporate violence became so normalized that it took a moment of shocking clarity for the country to remember it was always us versus them.\n\nTraditional flash. Bullet casings wrapped in flowers. Beautiful and blunt, the way all honest things eventually become.\n\nThis isn't advocating for anything except the obvious: a system that lets people die for profit was always going to produce its own vocabulary of consequence. These three words were theirs first. Now they belong to everyone who's held a denial letter and felt something shift.\n\nWear the flowers. Know what they're growing out of.\n\nThe claim was denied. The conversation wasn't.",
    displayOrder: 7,
    isSoldOut: false,
  },
  {
    slug: "scream-fuck-die",
    stripLabel: "Briefly.",
    stripColor: "pink",
    title: '"Scream F*ck Die" A Cicada\'s Life Philosophy Sticker',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#34d399",
    description:
      "Spend years buried underground doing absolutely nothing anyone asked of you. Emerge screaming. Make everyone uncomfortable. Die on your own terms.\nHonestly? Goals.\nThe cicada doesn't file a ticket. Doesn't circle back. Doesn't ask if this is a good time. It waits, it surfaces, and it immediately becomes everyone's problem — for exactly as long as it wants to be.\nThis is for the ones running on spite and overstimulation. The ones who've been underground too long. The ones whose inner monologue is just this sticker, on a loop, every time someone schedules a 4pm meeting on a Friday.\nThree words. No notes. No follow-up email required.\n\nScream. F*ck. Die. Repeat if necessary.",
    displayOrder: 8,
    isSoldOut: false,
  },
  {
    slug: "magical-stardust",
    stripLabel: "Hail.",
    stripColor: "blue",
    title:
      '"Listen Up, Bitch — You Are A Magical Piece Of F*cking Stardust" A Satanic Affirmation Sticker',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f0bcc7",
    description:
      "Nobody asked the universe for permission to exist. Neither did you. And yet here you are — made of the same stuff as dying stars, running on spite and cortisol, somehow still showing up.\nThis is the pep talk your therapist wanted to give you but couldn't, delivered by a pink pentagram with absolutely zero chill and genuinely good intentions.\nBecause sometimes you need the affirmation to match the actual energy it takes to get through a day. Soft fonts. Sharp words. A circle of protection that also tells you to go get what's yours.\nFor the witchy, the tired, the chaotically soft. The ones whose self-love sounds less like a meditation app and more like a best friend grabbing you by the shoulders in a parking lot.\nYou deserve the f*cking world. The pentagram agrees. Now act like it.\n\nYou are a magical piece of stardust having a small terrestrial moment. Behave accordingly. Pairs well with bathroom mirrors and the back of any van that's seen too many highway miles.\n\nBlessed be, b*tch. ✨",
    displayOrder: 9,
    isSoldOut: false,
  },
  {
    slug: "i-did-that",
    stripLabel: "I did that.",
    stripColor: "yellow",
    title: '"I Did That!" A Sticker Of Accountability',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f4ecd8",
    description:
      "Gas prices. Grocery bills. Your neighbor's deportation. The program that kept your mom alive that doesn't exist anymore. The friend who lost their job. The rights that were there last year. The thing you can't say out loud yet because it's still happening.\nHe's pointing. He wants the credit. Give it to him.\nThis sticker was born on gas pumps during a different administration by people who thought $4 a gallon was the worst it could get. Adorable. We have learned so much since then.\nPeel. Stick. Point. Repeat until your hands shake or your blood pressure forces you to take a walk.\nFor the scorekeepers. The receipt-savers. The ones who said this is not normal so many times the words lost meaning and the reality didn't.\nHe's still pointing. The list got longer while you were reading this.\n\nHe did that. And that. And that. And the thing you haven't found out about yet.",
    displayOrder: 10,
    isSoldOut: false,
  },
  {
    slug: "war-criminal",
    stripLabel: "Guilty.",
    stripColor: "lime",
    title: '"War Criminal" The Cost of an Ally',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#00d4ff",
    description:
      "Not a hot take. A line item.\nBillions in weapons. Vetoed resolutions. Blocked investigations. The careful diplomatic language that means we know and we're choosing not to stop it. This is what unconditional support looks like when you follow it all the way to the end.\nThe rubble. The hospitals. The journalists. The aid workers. The children — always the children — while the smile doesn't change and the checks keep clearing.\nHe's not a rogue actor. He's a policy decision. That's what makes it worse.\nFor the ones who've been saying it for years while the podium called it complicated. For the ones who lost friends over dinner for saying it plainly. For the ones who understand that an ally's crimes don't stop being crimes because we paid for them.\nThe ICC has a warrant. We have a sticker. Both are making the same argument.\n\nWar Criminal. The cost of an ally. Invoice overdue.Slap it wherever someone's busy calling a war criminal a 'respected elder statesman.'",
    displayOrder: 11,
    isSoldOut: true,
  },
  {
    slug: "luigi",
    stripLabel: "A guy.",
    stripColor: "pink",
    title: '"Luigi" A Sticker About A Guy Named Luigi',
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#a3e635",
    description:
      "He had a name that belonged to a video game character. He had a manifesto. He had a one-way ticket and a country full of people who'd been holding a denial letter long enough to understand, even if they wouldn't say it out loud.\nThis is not a wanted poster. This is a man waving hello from inside a cultural moment that was thirty years of broken healthcare policy in the making.\nThe smile is doing a lot of work. So is the name.\nFor everyone who read the news and felt something complicated. Who knew immediately why it spread. Who understood that folk heroes don't get made in a vacuum — they get made in waiting rooms, on hold with insurance, at kitchen tables with bills that don't add up.\nHe's waving. You know why you're waving back.\n\nIt's-a him. You know the one.",
    displayOrder: 12,
    isSoldOut: false,
  },
] as const;
