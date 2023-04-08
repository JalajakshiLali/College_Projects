#Group Project - Initial Analysis Report

#Load Libraries
library(dplyr)
library(zoo)
library(corrplot)
library(flextable)
library(ggpubr)
library(BSDA)
library(gtsummary)
library(tidyverse)
library(sf)
library(usmap)
library(ggplot2)
library(RColorBrewer)
library(car)
library(MASS)
library(readxl)

#Import dataset
triData<-read.csv("dataset/TRI_By_ID_1987_2014.csv")
names(triData)
#View(triData)
selectCols<-c("ammonia","chromium", "copper", "lead", "mercury", "ethyleneglycol", "methanol", "certainglycolethers", "nickel", "zinccompounds", "year","facility_name","city","county","st","federal_facility","parent_company_name","total_release_carcinogen","total_release_metal")

#triDataSub <- as.data.frame(triData)
triDataSub<-dplyr::select(triData,selectCols)

str(triDataSub)

# Descriptive statistics
triDataDescp= psych::describe(triDataSub)
triDataDescp= triDataDescp %>% select(n, min, max, vars, mean, sd)
write.csv(triDataDescp,"dataset\\Desc Stats1.csv")


colSums(is.na(triDataSub))
triDataSub$total_release_carcinogen[is.na(triDataSub$total_release_carcinogen)] = mean(triDataSub$total_release_carcinogen, na.rm = TRUE)
triDataSub$total_release_metal[is.na(triDataSub$total_release_metal)] = mean(triDataSub$total_release_metal, na.rm = TRUE)

#write.csv(triDataSub,"ALY6015 R project/dataset/project_clean_data.csv")

new = triDataSub%>%group_by(st)%>%summarise(sumCarc = sum(total_release_carcinogen)/22046,sumMet = sum(total_release_metal)/22046)
#colnames(new)[1]="state"
new$sumToxins = new$sumCarc+new$sumMet
new$state = new$st

#plot_usmap(regions = "states",data=new,values = "sumToxins") + 
  #labs(title = "U.S. States",
       #subtitle = "USA States Toxin Release Map") + 
  #theme(panel.background=element_blank())


populationData <- read_excel("dataset/populationData.xlsx")

plot_usmap(data = populationData, values = "population",regions = "states", color = "red",labels = TRUE) + 
  scale_fill_continuous(
    low = "white", high = "red", label = scales::comma,
  ) + theme(legend.position = "right")



plot_usmap(
  data = new, values = "sumMet", include = c("CA", "ID", "NV", "OR", "WA"), color = "red",labels = TRUE
) + 
  scale_fill_continuous(
    low = "white", high = "red", name = "Population (2015)", label = scales::comma
  ) + 
  labs(title = "Western US States", subtitle = "These are the states in the Pacific Timezone.") +
  theme(legend.position = "right")

#decCarc = sort(new$sumCarc,decreasing = TRUE)
#decMet = sort(new$sumMet,decreasing = TRUE)

newCarc = new[order(-new$sumCarc),]
newMet = new[order(-new$sumMet),]

top5carcen=head(newCarc,5)
top5met=head(newMet,5)

barplot(top5carcen$sumCarc,names.arg = top5carcen$st, ylab = "Total Carcinogen", xlab = "States", main = "States with highest carcinogen release per 10 metric tons", col = "blue")

barplot(top5met$sumCarc,names.arg = top5met$st,  ylab = "Total Metal Release", xlab = "States", main = "States with highest metal release per 10 metric tons", col = "red")


triOH = triDataSub%>%filter(st=="OH")

#triOH = st_as_sf(triOH, coords = c(lONGITUDE, lATITUDE), crs = 4326)

#plot(triOH$total_release_carcinogen, logz=T, pal=colorRampPalette(c("navy", "lightgray", "red")), reset=F)

#triOH_new = st_as_sf(triOH, coords = c(longitude, latitude), crs = 4326)


#Carcinogen and Metal Release Trends Over the years in Ohio
triOH_new_yr = triOH%>%group_by(year)%>%summarise(sumCarc = sum(total_release_carcinogen)/22046,sumMet = sum(total_release_metal)/22046)
plot(triOH_new_yr$sumCarc,type = "o", col = "blue", pch = 19, xlab = "yearly", ylab = "Carcinogen Release", main = "Carcinogen Release Trend over the years")
plot(triOH_new_yr$sumMet,type = "o", col = "red", pch = 19, xlab = "yearly", ylab = "Metal Release", main = "Metal Release Trend over the years")



#Correlation Plot
corMat = cor(select_if(triDataSub,is.numeric), use = "pairwise")
corrplot(corMat, type = 'upper')



#Subset Analysis
#Diol groups
triByYear<-triDataSub%>%group_by(year)%>%dplyr::select(c(ethyleneglycol,certainglycolethers,methanol))

#View(triByYear)
totDiol<-c(sum(triByYear$ethyleneglycol),sum(triByYear$certainglycolethers),sum(triByYear$methanol))
diolNames<-c("Ethylene Glycol","Glycolic Ethers","Methanol")
diolDf<-data.frame(diolNames,totDiol)

bar1<-ggplot(diolDf, aes(x = diolNames, y = totDiol, fill = diolNames))+geom_bar(stat = "identity", width = 0.7)+
  labs(title="Plot1: Barplot of Diol groups",x= "Diol Groups", 
       y= "Total Diol Release")+theme_classic()

#by most populated state 
triByState <- subset(triDataSub, triDataSub$st=="CA"|triDataSub$st=="TX"|triDataSub$st=="FL"|triDataSub$st=="NY"|triDataSub$st=="PA")
triByState$totToxicRelease<-triByState$total_release_carcinogen+triByState$total_release_metal

bar2<-ggplot(triByState,aes(y = totToxicRelease, x = st,fill = federal_facility))+geom_bar(stat = "identity", position = "dodge")+
  labs(title="Plot2: Barplot of toxic release by top 5 populated states",x= "Release metrics", 
       y= "States")

tri2014<-triDataSub%>%filter(year==2014)

#Box plot 
bx1<-qplot(x=federal_facility, y = mercury, data = tri2014, xlab = "Federal Facility",
           ylab = "Mercury Release", main="Box Plot of Mercury Release")+ geom_boxplot(aes(fill = federal_facility))+theme_light()+coord_cartesian(ylim = c(-1000, 15000)) 

bx2<-qplot(x=federal_facility, y = lead, data = tri2014, xlab = "Federal Facility",
           ylab = "Lead Release", main="Box Plot of Lead Release")+ geom_boxplot(aes(fill = federal_facility))+theme_light()+coord_cartesian(ylim = c(-1000, 15000)) 

bx3<-qplot(x=federal_facility, y = chromium, data = tri2014, xlab = "Federal Facility",
           ylab = "Chromium Release", main="Box Plot of Chromium Release")+ geom_boxplot(aes(fill = federal_facility))+theme_light()+coord_cartesian(ylim = c(-1000, 15000)) 

bx4<-qplot(x=federal_facility, y = ammonia, data = tri2014, xlab = "Federal Facility",
           ylab = "Ammonia Release", main="Box Plot of Ammonia Release")+ geom_boxplot(aes(fill = federal_facility))+theme_light()+coord_cartesian(ylim = c(-1000, 15000)) 

ggarrange(bx1,bx2,bx3,bx4,nrow=2,ncol=2)


#Mutating df by adding new columns
modTri<-triDataSub%>%mutate("Carcinogen_Percentage" = (total_release_carcinogen/sum(total_release_carcinogen))*100,"Metal_Percentage" = (total_release_metal/sum(total_release_metal))*100)
colnames(modTri)


#Hypothesis testing
#year-2014, state= CA
#H0 <- "Carcinogen and Metal release percentage in a year is same"
#H1 <- "Carcinogen and Metal release in a year is different"
#a <- 0.05

tri2014CA<-modTri%>%filter(st=="OH"&year==2014)
#tri2014CA<-head(tri2014CA,40)
test<- z.test(tri2014CA$Carcinogen_Percentage ,tri2014CA$Metal_Percentage,alternative="two.sided", mu = 0,
              sigma.x = sd(tri2014CA$Carcinogen_Percentage),
              sigma.y = sd(tri2014CA$Metal_Percentage),
              conf.level = 0.95)#Single sample two Sided T-test
test

modelData = modTri
modelData$totRelease<-modelData$total_release_carcinogen+modelData$total_release_metal
regressionFit<-lm(totRelease~ammonia+lead+mercury+methanol+copper+zinccompounds, data = head(modelData,1000))
summary(regressionFit)
AIC(regressionFit)
BIC(regressionFit)

par(mfrow = c(2,2))
plot(regressionFit)
dev.off()

vif(regressionFit)

#outliers test
outlierTest(regressionFit)

#Feature Selection
stepAIC(regressionFit, direction = "backward")
stepAIC(regressionFit, direction = "forward")
stepAIC(regressionFit, direction = "both")









