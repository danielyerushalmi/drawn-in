# Drawn In: research brief

How highly interactive websites affect company profits, and how they affect the people who use them.

This brief is the evidence base for both the site (`/drawn-in`) and your paper. Every number below has a source in the
reference list, a label for the *kind* of evidence it is, and a caveat where the popular version of the stat is wrong.
Use the labels in your paper: a company's own case study and a preregistered experiment are not the same weight.

---

## 1. The question, sharpened

> Do highly interactive websites (real-time 3D, physics, scroll-driven storytelling, and the engagement mechanics that
> ride along with them: play, variable reward, autoplay, endless feeds) make companies more money, and what do they cost
> the person on the other side of the screen?

Two kinds of "interactive" get blurred together, and separating them is the most useful move your paper can make:

| | **Expressive interactivity** | **Engagement mechanics** |
|---|---|---|
| Examples | Lusion, Oryzo, Casa Pala, Bruno Simon's driving portfolio, 3D product viewers | Infinite scroll, autoplay, pull-to-refresh, streaks, notification badges |
| What it is for | Showing a product, a brand, or a craft | Keeping you on the page longer |
| Main business payoff | Attention, perceived quality, memorability, purchase confidence | Time on site, sessions, ad inventory |
| Main cost | Speed, cognitive load, motion sensitivity, hidden content | Time and attention the user didn't intend to give |

Heavy, award-style sites mostly live in the left column, but they borrow tactics from the right one (novelty, play,
"one more scroll"). The site is built to show that overlap.

## 2. Proposed thesis (pick one, or argue against it)

**A. The curve (recommended, and what the evidence supports best).**
Interactivity pays when it *carries* the message and costs when it *competes* with it. Up to a point, play earns
attention, trust and sales; past that point, the same techniques spend the user's time, attention and comfort to buy
metrics (time on site, engagement) that do not reliably turn into profit, while the extra weight measurably loses sales.

**B. The transfer.**
Over-interactivity mostly moves value from users to companies: the "engagement" a company books as a gain is attention
a person did not choose to spend.

**C. The portfolio exception.**
For studios and creative portfolios, the interactive site *is* the product demo, so the usual costs are worth paying;
for stores and services they usually are not.

Thesis A lets you use C as a concession and B as the warning, which makes for a stronger paper than any single-sided one.

---

## 3. Evidence: what it earns the company

| Claim | Number | Evidence type | Caveat |
|---|---|---|---|
| Interacting with a 3D product model is linked to buying | Shoppers who used 3D were **27%** more likely to order, **44%** more likely to add to cart; AR viewers **65%** more likely to buy (Rebecca Minkoff) | Company-reported case study (Shopify) | Correlation: people who bother to spin a model were already more interested. Not an A/B test. |
| 3D raises conversion | "**94%** increase in conversions" vs photos alone | Platform marketing claim (Shopify blog) | No published method or sample. Cite as a claim, not a finding. |
| Interactive content converts better | **70%** vs **36%** | *Survey of marketers' opinions* (Demand Metric / Demand Gen) | Often misquoted as a conversion rate. It is how marketers *rated* their own content. |
| Spectacle builds reach | Bruno Simon's 3D driving portfolio: **400,000+** visitors, Awwwards Site of the Year 2020 | Press/interviews | A portfolio's "conversion" is reputation and work, hard to measure. |
| The site itself is the pitch | Lusion's stated goal for its own site: "showcase our digital craftsmanship", "engage potential brand and agency partners" | Self-published award entry (Cannes Lions) | No performance numbers published. |
| **Interactive product visualisation raises real sales, where shoppers are unsure** | AR use on a cosmetics retailer's app was linked to higher sales, most for less popular brands, narrower-appeal and pricier products, and customers new to the channel | **Peer-reviewed, real sales data** (Tan, Chandukala & Reddy, *Journal of Marketing* 2022; AMA/MSI Paul Root Award) | Observational, one retailer. The strongest pro-profit study you have, and it is *conditional*: interactivity pays when it reduces uncertainty, not everywhere. |
| Memorable experiences are a product | Experiences are a distinct economic offering; the memory is what is sold | Business theory (Pine & Gilmore, HBR 1998) | Framework, not measurement. |
| Looks shape perceived usability | Visual appeal judged in **50 ms**, and those judgements agree with longer looks; beautiful interfaces are *rated* more usable even after use | Peer-reviewed lab studies (Lindgaard et al. 2006; Kurosu & Kashimura 1995; Tractinsky et al. 2000) | Perceived, not actual, usability. |
| Making something makes you value it | People value things they assembled themselves more, close to expert-made items | Peer-reviewed experiments (Norton, Mochon & Ariely 2012) | Effect disappears if the task isn't completed. Configurators exploit this. |
| Flow online drives shopping behaviour | Interactivity and telepresence feed "flow", which relates to online shopping and browsing | Peer-reviewed structural model (Novak, Hoffman & Yung 2000) | Survey-based, early-web era. |

## 4. Evidence: what it costs the company

| Claim | Number | Evidence type | Caveat |
|---|---|---|---|
| Speed is money | **0.1 s** faster mobile site: **+8.4%** retail conversions, **+9.2%** average order value | Commissioned study, 37 brands (Deloitte for Google, 2020) | Correlational; commissioned by a company that sells speed tooling. |
| Speed is money, tested properly | **31%** faster LCP produced **8%** more sales, +15% lead-to-visit, +11% cart-to-visit | A/B test (Vodafone, web.dev 2021) | One company, one landing page. The strongest single causal number you have. |
| Slow pages lose people | **53%** of mobile visits abandoned when load passes **3 s** | Google industry research (2016) | Old; phones and networks are faster now, pages are heavier. |
| Bounce rises with delay | 1 s to 3 s load: bounce *probability* rises **32%** | Google/SOASTA model (2017) | It is a relative increase, not a 32% bounce rate. Widely misquoted. |
| Pages keep getting heavier | Median mobile JavaScript **558 KB** in 2024 (+14% in one year); about **47%** of it unused | Measured crawl (HTTP Archive Web Almanac 2024) | Median sites, not award sites, which are far heavier. |
| More interactivity can mean *less* remembered | Interactive tools raise recall of what they carry but **lower** recall of nearby non-interactive content; a *moderate* level worked best; users spent *less* total time on the most interactive version | Peer-reviewed experiment, e-commerce site (Xu & Sundar 2016) | Lab setting. The single most important study for thesis A. |
| Interesting-but-irrelevant hurts understanding | Adding entertaining extras lowered recall and comprehension of the core lesson ("seductive details") | Peer-reviewed experiments (Harp & Mayer 1998) + later meta-analyses | Effect is small to moderate on average. |
| Motion grabs the eye, not always the task | Salient/animated ads attract gaze and disrupt reading; animation features drew attention while browsing but had no effect during searching | Peer-reviewed eye-tracking experiments (Simola et al. 2011; Hong, Cheung & Thong 2021) | Findings are mixed on task performance; the task decides. Good nuance for the "attention vs understanding" argument. |
| Regulation is coming for engagement mechanics | EU consultation treats infinite scroll, autoplay and streak penalties as "addictive design"; 70% of respondents favoured binding rules, most wanted these features off by default | Policy process (European Commission, Digital Fairness Act, 2025–26) | A future cost: features that earn engagement today may have to be redesigned or switched off. Check the Act's current status before citing. |
| Parallax and scroll effects have usability costs | Can slow loading and make content hard to read | Practitioner research (Nielsen Norman Group) | Qualitative guidance. |

## 5. Evidence: what it costs the person

| Claim | Number | Evidence type | Caveat |
|---|---|---|---|
| Attention on a screen keeps shrinking | Average time on one screen before switching: about **2.5 min** (2004), **75 s** (2012), **47 s** (recent) | Field observation of information workers (Gloria Mark, UC Irvine) | Measures screen switching at work, not a biological "attention span". The goldfish stat is a myth; don't use it. |
| Interruptions are expensive | About **25 min** to return to an interrupted task | Mark's research, reported in her book *Attention Span* (2023) | Secondary reporting. |
| Autoplay extends sessions | Turning Netflix autoplay **off** cut sessions by about **18 min** | Field experiment, 76 users (Schaffner & Chetty, UChicago, CSCW 2025) | Small sample; half the participants turned it back on afterwards for convenience. |
| Infinite scroll runs in loops | Nested loops: short in-session loops inside a habitual one; most reasons people *stop* come from life outside the app, not the app | Field study, 46 users (Rixen et al., MobileHCI 2023, honourable mention) | Social media apps, not websites in general. |
| The inventor regrets it | Aza Raskin, who designed infinite scroll (2006), has said he regrets how it is used | Interviews (Masters of Scale and others) | The "lifetimes wasted" figures attributed to him vary by source. Avoid the number. |
| Variable rewards hook learning systems | Unexpected rewards spike dopamine signalling; the response moves to the cue | Neuroscience explainer (Haynes, Harvard SITN 2018) | The mechanism is solid; "social media is addictive like slot machines" is analogy, not proof. |
| People can't judge their own use | Self-reported use correlates only moderately with logged use; under 10% of reports land within 5% of the truth | Meta-analysis, 106 effect sizes (Parry et al. 2021, *Nature Human Behaviour*) | Errors go in both directions. |
| Motion makes some people ill | **35.4%** of US adults 40+ show vestibular dysfunction on a balance test; parallax and large motion can trigger dizziness and nausea | Epidemiology (Agrawal et al. 2009, NHANES) + W3C WCAG 2.3.3 | The 35% is a balance-test measure, not "35% get sick from websites". Phrase it carefully. |
| Phones drain thinking even when idle | Ward et al. (2017): phone on the desk lowered working memory | Peer-reviewed lab study | **Failed a preregistered replication** (Ruiz Pardo & Minda 2022). Use it as a cautionary example, not as evidence. |

## 6. Counterarguments your paper should answer

1. **"Interactive sites win awards and clients, so they're profitable."** True for studios (thesis C). The interactive
   site is the product sample. Answer: the evidence for *stores* is weaker and mostly company-reported.
2. **"People *like* these sites."** Aesthetic-usability says people rate beautiful things as easier to use. Answer:
   liking and remembering aren't the same (Xu & Sundar), and perceived ease isn't actual ease.
3. **"Engagement is the goal."** Answer: time on site is a cost to the user and only sometimes revenue to the company;
   the Xu & Sundar participants spent *less* total time on the most interactive version.
4. **"Speed problems are solved by better phones."** Answer: Web Almanac shows pages growing faster than that, and the
   Vodafone A/B test is from 2021.

## 7. Paper outline: long version (10 to 12 pages, APA, about 3,000 to 3,600 words)

Page budgets assume double spacing (~300 words a page). Each section lists the claim to make, the evidence to use, and
the question it must answer. Aim for 20+ sources; the reference list below has 30.

**Title idea:** *Drawn In: What Highly Interactive Websites Earn for Companies and Take from People*

**1. Introduction (1 page)**
- Hook: describe being pulled into a site like lusion.co, oryzo.ai or your own Drawn In site; the moment you notice
  how long you've been there.
- Context: interactive web design has gone from novelty to arms race (Awwwards, WebGL, scroll storytelling), while
  regulators now call some engagement features "addictive design" (Digital Fairness Act).
- Thesis (A, "the curve"), stated in one or two sentences.
- Roadmap of the paper.

**2. Definitions and scope (1 page)**
- The table from §1: expressive interactivity vs engagement mechanics. Argue why separating them matters.
- What "profit" means here: conversion, order value, brand/reputation, *and* costs (speed, regulation, trust).
- What "affects a person" means: attention, time, memory, wellbeing, physical comfort.

**3. Why interactivity pays (2 pages)**
- First impressions: Lindgaard (50 ms), aesthetic-usability (Kurosu & Kashimura; Tractinsky).
- Engagement psychology: flow online (Novak et al.), IKEA effect (Norton et al.), experience economy (Pine & Gilmore).
- Commerce evidence, ranked by strength: Tan et al. 2022 (peer-reviewed sales data) first; then company-reported
  3D/AR numbers (Rebecca Minkoff, Shopify) *with their caveats*; the 70/36 survey as an example of a misquoted stat.
- Studios and portfolios: Lusion and Bruno Simon; the site *is* the product sample.
- Question to answer: is this evidence of profit, or of engagement that companies assume becomes profit?

**4. Where it costs the company (2 pages)**
- Speed: Vodafone A/B (the strongest causal number), Deloitte, Google 53% and 32%.
- Weight trend: Web Almanac 2024; your own site's measured weight as a case study (3.26 MB).
- Memory trade-off: Xu & Sundar 2016 (the core study); seductive details (Harp & Mayer).
- Attention vs task: animated-ad eye-tracking (Simola et al.; Hong et al.).
- Regulatory risk: Digital Fairness Act consultation.
- Question to answer: when does the cost outweigh the gain? (Tan et al.'s answer: when interactivity no longer reduces
  uncertainty.)

**5. What it takes from the person (2 to 2.5 pages)**
- Attention: Gloria Mark's 2.5 min to 47 s (with the "not a biological limit" caveat; debunk the goldfish myth).
- Designed momentum: infinite scroll (Raskin; Rixen et al. 2023), autoplay (Schaffner & Chetty 2025).
- Reward: variable reward and dopamine (Haynes 2018), carefully separated from the "slot machine" analogy.
- Self-perception: Parry et al. 2021; people can't judge their own use, which makes "users chose to stay" a weak defence.
- The body: vestibular dysfunction (Agrawal et al.), WCAG 2.3.3, reduced-motion settings.
- A caution paragraph: Ward et al.'s "Brain Drain" and its failed replication, to show you've read critically.

**6. The curve: synthesis (1.5 pages)**
- Bring sections 3 to 5 together: benefits rise fast and flatten; costs keep rising. A moderate level keeps showing up
  (Xu & Sundar; Tan et al.'s conditional effect).
- Describe the companion site as an applied demonstration (the reveal and the recall quiz). Optionally include a
  figure: a screenshot of the curve, labelled as a conceptual model.

**7. Counterarguments and rebuttals (1 page)**
- The four in §6, one paragraph each.

**8. Conclusion and design principles (1 page)**
- Restate the thesis in light of the evidence.
- The five principles from the site's closing chapter.
- Limits of the evidence (much is company-reported; lab studies; one A/B test) and what research is missing:
  no independent controlled tests of award-style 3D sites on sales.

**References (2+ pages)**

Writing tips for this topic:
- Put the evidence label in the sentence: "In a controlled A/B test, Vodafone found…" vs "Shopify reports…".
- Never use the 94% or 70/36 numbers without saying what they actually measure.
- Use the site's own measured weight and the reveal as first-hand evidence; describe exactly what was measured.

---

## 8. How the site maps to the paper

The site demonstrates the techniques on the reader before explaining them:

| Site chapter | Technique used on you | Research behind it |
|---|---|---|
| Hero: 3D tiles drawn to your cursor (they follow you through every scene) | Novelty and play, flow | Novak et al. 2000 |
| 01 Fifty milliseconds (a 3D screen flashes a calm and a loud web page for 50 ms each) | First-impression judgement | Lindgaard 2006; Tractinsky 2000 |
| 02 Labour leads to love (grab 3D pieces into a frame, then price it) | IKEA effect | Norton et al. 2012 |
| 03 One more pull (pull-to-refresh) | Variable reward | Haynes 2018 |
| The Continue button that counts down and presses itself | Default momentum (autoplay) | Schaffner & Chetty 2025 |
| The session clock and the live event log on screen | Session recording, in plain sight | (shown at the reveal) |
| **The reveal: "See? You're drawn in."** | Your own session stats + a recall check | Xu & Sundar 2016; Parry 2021 |
| Part II/III: the page goes calm | The contrast is the argument | All of §3 to §5 |
| The curve | Interactive conceptual model | Synthesis |

Nothing the site measures leaves the browser. Say so in the paper if you describe the site.

---

## References (APA 7)

Agrawal, Y., Carey, J. P., Della Santina, C. C., Schubert, M. C., & Minor, L. B. (2009). Disorders of balance and vestibular function in US adults: Data from the National Health and Nutrition Examination Survey, 2001–2004. *Archives of Internal Medicine, 169*(10), 938–944. https://doi.org/10.1001/archinternmed.2009.66

Deloitte Digital. (2020). *Milliseconds make millions* [Report commissioned by Google]. https://www2.deloitte.com/content/dam/Deloitte/ie/Documents/Consulting/Milliseconds_Make_Millions_report.pdf

Demand Metric. (2016). *Content experience report: Interactive vs. passive content* [Survey]. Summarised at https://uplandsoftware.com/kapost/resources/blog/interactive-content-conversions/

Google. (2016). *The need for mobile speed*. Summarised by MediaPost: https://www.mediapost.com/publications/article/284398/

Harp, S. F., & Mayer, R. E. (1998). How seductive details do their damage: A theory of cognitive interest in science learning. *Journal of Educational Psychology, 90*(3), 414–434. https://doi.org/10.1037/0022-0663.90.3.414

Haynes, T. (2018, May 1). Dopamine, smartphones & you: A battle for your time. *Science in the News, Harvard University*. https://sitn.hms.harvard.edu/flash/2018/dopamine-smartphones-battle-time/

European Commission. (2025). *Digital Fairness Act: Public consultation and call for evidence*. Summaries: Osborne Clarke, https://www.osborneclarke.com/insights/digital-fairness-act-unpacked-addictive-design ; Slaughter and May, https://thelens.slaughterandmay.com/post/102m222/digital-fairness-act-european-commission-publishes-responses-to-consultation

Hong, W., Cheung, M. Y. M., & Thong, J. Y. L. (2021). The impact of animated banner ads on online consumers: A feature-level analysis using eye tracking. *Journal of the Association for Information Systems, 22*(1). https://aisel.aisnet.org/jais/vol22/iss1/2

HTTP Archive. (2024). *Web Almanac 2024: JavaScript*. https://almanac.httparchive.org/en/2024/javascript

Kurosu, M., & Kashimura, K. (1995). Apparent usability vs. inherent usability. *CHI '95 Conference Companion*, 292–293. https://doi.org/10.1145/223355.223680

Lindgaard, G., Fernandes, G., Dudek, C., & Brown, J. (2006). Attention web designers: You have 50 milliseconds to make a good first impression! *Behaviour & Information Technology, 25*(2), 115–126. https://doi.org/10.1080/01449290500330448

Lusion. (2024). *Lusion v3* [Cannes Lions award entry]. https://lovethework.com/work-awards/campaigns/lusion-1630885

Mark, G. (2023). *Attention span: A groundbreaking way to restore balance, happiness and productivity*. Hanover Square Press. See also University of California (2024): https://www.universityofcalifornia.edu/news/how-sharpen-your-attention-and-meet-your-goals-2024

Nielsen Norman Group. (n.d.). *What parallax lacks*. https://www.nngroup.com/articles/parallax-usability/

Norton, M. I., Mochon, D., & Ariely, D. (2012). The IKEA effect: When labor leads to love. *Journal of Consumer Psychology, 22*(3), 453–460. https://doi.org/10.1016/j.jcps.2011.08.002

Novak, T. P., Hoffman, D. L., & Yung, Y.-F. (2000). Measuring the customer experience in online environments: A structural modeling approach. *Marketing Science, 19*(1), 22–42. https://doi.org/10.1287/mksc.19.1.22.15184

Parry, D. A., Davidson, B. I., Sewall, C. J. R., Fisher, J. T., Mieczkowski, H., & Quintana, D. S. (2021). A systematic review and meta-analysis of discrepancies between logged and self-reported digital media use. *Nature Human Behaviour, 5*, 1535–1547. https://doi.org/10.1038/s41562-021-01117-5

Pastel. (n.d.). *How a design portfolio got the attention of 400,000 visitors* [Interview with Bruno Simon]. https://usepastel.com/blog/how-a-design-portfolio-got-the-attention-of-400-000-visitors

Pine, B. J., II, & Gilmore, J. H. (1998). Welcome to the experience economy. *Harvard Business Review, 76*(4), 97–105.

Rixen, J. O., Meinhardt, L., Glöckler, M., Schlothauer, A., Ziegenbein, M., Colley, M., Gugenheimer, J., & Rukzio, E. (2023). The loop and ways to break it: Investigating infinite scrolling behaviour in social media applications and reasons to stop. *Proceedings of MobileHCI '23*. https://doi.org/10.1145/3604275

Ruiz Pardo, A. C., & Minda, J. P. (2022). Reexamining the "brain drain" effect: A replication of Ward et al. (2017). *Acta Psychologica, 230*, 103717. https://doi.org/10.1016/j.actpsy.2022.103717

Schaffner, B., & Chetty, M. (2025). [Netflix autoplay field experiment]. *Proceedings of the ACM on Human-Computer Interaction (CSCW)*. University news summary: https://news.uchicago.edu/story/uchicago-scientists-study-hidden-cost-netflixs-autoplay

Shopify. (n.d.). *Rebecca Minkoff* [Case study]. https://www.shopify.com/case-studies/rebecca-minkoff

Shopify. (n.d.). *3D model products* [Blog]. https://www.shopify.com/blog/3d-model-products

Simola, J., Kuisma, J., Öörni, A., Uusitalo, L., & Hyönä, J. (2011). The impact of salient advertisements on reading and attention on web pages. *Journal of Experimental Psychology: Applied, 17*(2), 174–190. https://doi.org/10.1037/a0024042

Tan, Y.-C., Chandukala, S. R., & Reddy, S. K. (2022). Augmented reality in retail and its impact on sales. *Journal of Marketing, 86*(1), 48–66. https://doi.org/10.1177/0022242921995449

Tractinsky, N., Katz, A. S., & Ikar, D. (2000). What is beautiful is usable. *Interacting with Computers, 13*(2), 127–145. https://doi.org/10.1016/S0953-5438(00)00031-X

Vodafone / Google. (2021). *Vodafone: A 31% improvement in LCP increased sales by 8%*. web.dev. https://web.dev/case-studies/vodafone

W3C. (2018). *Understanding success criterion 2.3.3: Animation from interactions*. https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions

Ward, A. F., Duke, K., Gneezy, A., & Bos, M. W. (2017). Brain drain: The mere presence of one's own smartphone reduces available cognitive capacity. *Journal of the Association for Consumer Research, 2*(2), 140–154. https://doi.org/10.1086/691462

Xu, Q., & Sundar, S. S. (2016). Interactivity and memory: Information processing of interactive versus non-interactive content. *Computers in Human Behavior, 63*, 620–629. https://doi.org/10.1016/j.chb.2016.05.046

> Verify before submitting: a few DOIs and page ranges above (Kurosu & Kashimura, Harp & Mayer, Xu & Sundar,
> Ruiz Pardo & Minda, Agrawal, Parry, Simola et al., Hong et al.) are from standard citation records rather than opened full texts. Paste each DOI
> into doi.org to confirm. The Schaffner & Chetty paper's final title should be taken from the CSCW proceedings.
