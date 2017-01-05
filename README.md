## Summary

Many parasitic worms, like tapeworms or nematodes, have complex and bizarre life cycles, in which they infect multiple hosts in succession before reproducing. This visualization shows how parasites grow over the course of their life cycles as they are transmitted from one host to the next. Different data subsets can be viewed interactively (such as a random species, parasites with different life cycle lengths, or different types of hosts). My main goal was to show that parasite strategies are very diverse yet there are some common themes.

## Design

I put parasite size on the y-axis and host number on the x-axis. This is rather analagous to a growth chart (size on y, time on x). There were almost 1000 species in the data, and each line connects the life stages of a single parasite species. This shows how some points are interdependent, and it is preferable to showing averages for each x-category, which would obscure the interesting variation between species.

Next, I wanted to highlight whether species have long or short life cycles. On the initial chart that loads with the page (or after pressing the 'RESET' button), life cycle length is encoded by different colors. Admittedly, the differences are not very easy to distinguish, given how much groups overlap. I also tried to emphasize different types of hosts by increasing line thickness on this chart (see e.g. trans_to_int.png and/or trans_to_def.png in folder 'prelim_plots'). This made the plot even 'busier'; there were too many groups encoded and too much overlapping data.

This overplotting motivated the chart's interactivity, where a user can highlight different groups, one at a time. When the buttons are pressed, the selected data subset is highlighted with color and less opacity, while the non-selected data fades into the background.

After adding interactivity, I decided to retain the intial plot as a starting point, even with its 'busy' color encodings. I like the asethetics of it and thought a monochromatic plot would be unappealing.

## Feedback

The main feedback that I received at the sketching stage was that there were too many things to distinguish at once (growth, the different life cycle lengths, different transmission types; see X.png). This helped me decide on an interactive scheme. Once I made the plot interactive, I got some more useful feedback from a family member. They said I used too much technical jargon ('what's a definitive host?'). My target audience is other biologists that should understand the jargon, but these data groupings could be explained better. I thus added the feature where, when a button is pressed, a text box is amended to the bottom of the plot that explains the displayed data pattern.

## Resources
Data source: [Benesh et al. 2016. Ecology. In press](http://onlinelibrary.wiley.com/doi/10.1002/ecy.1680/full)

Examples that I partially adapted to my plot:
[for having multiple lines per plot](http://bl.ocks.org/d3noob/d8be922a10cb0b148cd5),
[for adding gridlines](https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218),
[for text transitions](http://bl.ocks.org/mbostock/f7dcecb19c4af317e464).

I also relied on w3schools for the basice syntax of [Javascript, CSS, and HTML](http://www.w3schools.com/)
