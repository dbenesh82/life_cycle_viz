library(dplyr)
library(ggplot2)
library(tidyr)
library(RColorBrewer)

options(stringsAsFactors = FALSE)

setwd("C:/Users/Dan/OneDrive/Documents/Benesh/Research/LifeCycle_Database/Data_paper/")
dataH<-read.csv(file="CLC_database_hosts.csv", header = TRUE, sep=",")
dataL<-read.csv(file="CLC_database_lifehistory.csv", header = TRUE, sep=",")

#RE-WRANGLING
#estimate volume - start by creating new volume variable
dataL$Biovolume <- NA
dataL$Biovolume <- as.numeric(dataL$Biovolume)
#if shape is cylinder, elongate, whip, calculate volume as a cylinder
sv <- which(dataL$Shape == "cylinder" | dataL$Shape == "thread-like" | dataL$Shape == "whip")
dataL$Biovolume[sv] <- 
  pi * (dataL$Width[sv]/2)^2 * dataL$Length[sv]
#if shape is coiled, sphere, oval, prolate spheroid, calculate volume as an ellipsoid
sv <- which(dataL$Shape == "coiled" | dataL$Shape == "sphere" | dataL$Shape == "ellipsoid")
dataL$Biovolume[sv] <-
  4/3 * pi * dataL$Length[sv]/2 * dataL$Width[sv]/4
#if shape is a ribbon, leaf, calculate volume as an area
sv <- which(dataL$Shape == "ribbon" | dataL$Shape == "leaf")
dataL$Biovolume[sv] <-
  dataL$Length[sv] * dataL$Width[sv]
rm(sv)



#remove troublesome values
asexs <- filter(dataH, Asexual != 'none')%>%select(Parasite.species)%>%distinct()
dataL.sp <- filter(dataL, !Parasite.species %in% asexs$Parasite.species)%>% #remove data for asexual species
  mutate(stsex = paste(Stage, Sex))%>%
  filter(stsex != "adult m")%>%select(-stsex) #remove adult males before averaging
rm(asexs)




#distinguish species transmitted by either eggs or hatched propagules
prop <- select(dataL, Parasite.species, Egg.hatch)%>%
  filter(!is.na(Egg.hatch))%>%distinct()
prop$selector<-"free larva"
prop$selector[which(prop$Egg.hatch == "eaten")]<-"embryo"

#this block tags rows that are propagules (host.no=0) and the stage from which growth starts (i.e. free larvae or embryos)
dataL.sp$propagule.selector[
  dataL.sp$Host.no == 0 & 
    is.na(match(paste(
      dataL.sp$Parasite.species, dataL.sp$Stage), 
      paste(prop$Parasite.species, prop$selector)))
  ] <- 1
dataL.sp <- filter(dataL.sp, is.na(propagule.selector))%>%
  select(-propagule.selector) #remove the unneeded stages from the propagule level





#get species averages
dataL.sp <- group_by(dataL.sp, Parasite.species, Parasite.group, Host.no, Stage)%>%
  summarize(Length = mean(Length, na.rm = T),
            Width = mean(Width, na.rm = T),
            Biovolume = mean(Biovolume, na.rm=T))




#add min and max life cycle length information to species level data
maxLCL <- group_by(dataH, Parasite.species)%>%summarize(maxLCL = max(Host.no))
minLCL <- filter(dataH, Facultative == "no")%>%
  group_by(Parasite.species)%>%summarise(minLCL = length(unique(Host.no)))

dataL.sp <- left_join(dataL.sp, minLCL, by = "Parasite.species")
dataL.sp <- left_join(dataL.sp, maxLCL, by = "Parasite.species")
dataL.sp <- mutate(dataL.sp, 
                   midLCL = (minLCL + maxLCL)/2, 
                   Flex.cycle = ifelse(minLCL != maxLCL, 'yes', 'no'))

#add host variables
host.fac <- select(dataH, Parasite.species, Host.no, Facultative, Def.int)%>%distinct()
host.fac <- mutate(host.fac, Facultative_bool = ifelse(Facultative != 'no', 'yes', 'no'))
dataL.sp <- left_join(dataL.sp, host.fac)
#infects humans?
humans <- filter(dataH, Host.species == "Homo sapiens")%>%select(Parasite.species, Host.no)%>%
  mutate(human = "yes")
dataL.sp <- left_join(dataL.sp, humans)
dataL.sp$human[is.na(dataL.sp$human)] <- "no"
rm(maxLCL, minLCL, prop, host.fac, humans)


#rearrange columns for clarity
dataL.sp <- select(dataL.sp, Parasite.species, Parasite.group, minLCL, maxLCL, midLCL, 
                   Host.no, Facultative, Facultative_bool, Stage, Def.int, Flex.cycle, human,
                   Length, Width, Biovolume)


#create host.no factor variable for x-axis in plots
dataL.sp$Host.nofac <- factor(dataL.sp$Host.no, labels = c("propagule", "1st", "2nd", "3rd", "4th", "5th"))



#create variables for different kinds of transmission the lines
dataL.sp$trans.to.int <- "no"
dataL.sp$trans.to.def <- "no"
dataL.sp$trans.to.fac <- "no"
dataL.sp$trans.to.human <- "no"
for(i in seq_along(dataL.sp$Def.int)){
  di <- dataL.sp$Def.int[i+1]
  if(is.na(di)) {
    next
  } else if(di == "int") {
    dataL.sp$trans.to.int[i] <- "yes"
  } else if(di == "def") {
    dataL.sp$trans.to.def[i] <- "yes"
  }
  
  if(dataL.sp$Facultative[i + 1] != "no") {
    dataL.sp$trans.to.fac[i] <- "yes"
  }
  
  if(dataL.sp$human[i + 1] == 'yes') {
    dataL.sp$trans.to.human[i] <- "yes"
  }
}



#create variable if size measurements over cycle are complete
dataL.sp$complete_size <- "incomplete"
for(species in unique(dataL.sp$Parasite.species)){
  bv <- dataL.sp$Biovolume[which(dataL.sp$Parasite.species == species)]
  if(sum(is.na(bv)) == 0) {
    dataL.sp$complete_size[which(dataL.sp$Parasite.species == species)] <- "complete"
  } else if(sum(is.na(bv))-1 == 
            unique(dataL.sp$maxLCL[which(dataL.sp$Parasite.species == species)])) {
    dataL.sp$complete_size[which(dataL.sp$Parasite.species == species)] <- "all missing"
  }
}






#set theme for plots
theme.o <- theme_update(axis.text = element_text(colour="black", size = 14),
                        axis.title = element_text(colour="black", size = 15, lineheight=0.25),
                        axis.ticks = element_line(colour="black"),
                        panel.border = element_rect(colour = "black",fill=NA),
                        panel.grid.minor=element_blank(),
                        panel.grid.major=element_line(color="gray",linetype = "dotted"),
                        panel.background= element_rect(fill = NA))



#plot parasite size over the life cycle
ggplot(data=dataL.sp,
       aes(x=Host.nofac, y=log10(Biovolume), group=Parasite.species, color=as.factor(maxLCL))) +
  geom_line(alpha=0.15) + 
  geom_point(size=2, alpha=0.1) +
  labs(x="\nHost",y="Log(Biovolume)\n") +
  guides(color = FALSE) +
  scale_color_manual(values = brewer.pal(5,"Set2"))+
  scale_x_discrete(expand=c(0.05,0.05))


#highlight intermediate hosts
ggplot(data=arrange(dataL.sp, trans.to.int),
       aes(x=Host.nofac, y=log10(Biovolume), 
           group=Parasite.species, color=as.factor(maxLCL))) +
  geom_line(aes(alpha = trans.to.int)) + 
  geom_point(size=2, alpha=0.1) +
  labs(x="\nHost",y="Log(Biovolume)\n") +
  guides(color = FALSE, alpha = FALSE) +
  scale_alpha_discrete(range = c(0.1, 0.7)) +
  scale_color_manual(values = brewer.pal(5,"Set2"))+
  scale_x_discrete(expand=c(0.05,0.05)) +
  annotate("text", x = 4.5, y = -4.5, label = "Transmission to intermediate hosts", 
           size = 6, color = "darkgray")




#highlight definitive hosts
ggplot(data=arrange(dataL.sp, trans.to.def),
       aes(x=Host.nofac, y=log10(Biovolume), 
           group=Parasite.species, color=as.factor(maxLCL))) +
  geom_line(aes(alpha = trans.to.def)) + 
  geom_point(size=2, alpha=0.1) +
  labs(x="\nHost",y="Log(Biovolume)\n") +
  guides(color = FALSE, alpha = FALSE) +
  scale_alpha_discrete(range = c(0.1, 0.7)) +
  scale_color_manual(values = brewer.pal(5,"Set2"))+
  scale_x_discrete(expand=c(0.05,0.05)) +
  annotate("text", x = 4.5, y = -4.5, label = "Transmission to definitive hosts", 
           size = 6, color = "darkgray")




#highlight facultative hosts
ggplot(data=arrange(dataL.sp, trans.to.fac),
       aes(x=Host.nofac, y=log10(Biovolume), 
           group=Parasite.species, color=as.factor(maxLCL))) +
  geom_line(aes(alpha = trans.to.fac)) + 
  geom_point(size=2, alpha=0.1) +
  labs(x="\nHost",y="Log(Biovolume)\n") +
  guides(color = FALSE, alpha = FALSE) +
  scale_alpha_discrete(range = c(0.1, 1)) +
  scale_color_manual(values = brewer.pal(5,"Set2"))+
  scale_x_discrete(expand=c(0.05,0.05)) +
  annotate("text", x = 4.5, y = -4.5, label = "Transmission to facultative hosts", 
           size = 6, color = "darkgray")





#highlight humans
ggplot(data=arrange(dataL.sp, trans.to.human),
       aes(x=Host.nofac, y=log10(Biovolume), 
           group=Parasite.species, color=as.factor(maxLCL))) +
  geom_line(aes(alpha = trans.to.human)) + 
  geom_point(size=2, alpha=0.1) +
  labs(x="\nHost",y="Log(Biovolume)\n") +
  guides(color = FALSE, alpha = FALSE) +
  scale_alpha_discrete(range = c(0.1, 1)) +
  scale_color_manual(values = brewer.pal(5,"Set2"))+
  scale_x_discrete(expand=c(0.05,0.05)) +
  annotate("text", x = 4.5, y = -4.5, label = "Transmission to humans", 
           size = 6, color = "darkgray")

