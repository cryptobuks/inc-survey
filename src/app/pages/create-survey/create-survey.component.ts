import { CdkDragDrop, CdkDragEnter, CdkDragExit, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, ViewChild } from '@angular/core';
import BigNumber from 'bignumber.js';
import { QuestionImplComponent } from 'src/app/comps/question-impl/question-impl.component';
import { DynamicItem } from 'src/app/models/dynamic-item';
import { QuestionImpl } from 'src/app/models/question-impl';
import { SurveyEditState } from 'src/app/models/survey-edit-state';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { ValidationOperator, ValidationExpression, ResponseType } from 'src/app/models/survey-model';
import { ComponentType, RESPONSE_TYPE } from 'src/app/models/survey-support';
import { DAY_MILLIS, HOUR_MILLIS } from 'src/app/shared/constants';
import { cloneDeep, isEmpty, isValidHttpUrl, lengthBase64, resizeBase64Image, truncateSeconds, isDigit, isUDigit, ScrollPosition, loadPageList, uniqueId, moveScrollTo, insertValidationError, toFixedBigNumber, isImageUrl, isIpfsUri, isImageData, formatDuration, toAmount, toUnits, randomIntFromInterval, calcGasReserve, toFormatBigNumber } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';
declare var $: any;
declare var uuidv4: any;

interface QuestionType {
  icon?: string;
  svgIcon?: string;
  label: string;
  componentType: ComponentType;
  componentData: any;
  validationDescKeys?: string[];
  preview?: DynamicItem;
}

@Component({
  selector: 'app-create-survey',
  templateUrl: './create-survey.component.html',
  styleUrls: ['./create-survey.component.css']
})
export class CreateSurveyComponent extends BasePageComponent {

  readonly titleKey = "create_survey";

  defaultOptions = [
    { value: 1, label: this.translateService.instant("option") + " 1" },
    { value: 2, label: this.translateService.instant("option") + " 2" },
    { value: 3, label: this.translateService.instant("option") + " 3" },
    { value: 4, label: this.translateService.instant("option") + " 4" }
  ];

  availableQuestions = [
    {
      icon: 'short_text',
      label: 'short_text_response',
      componentType: ComponentType.TEXT_SINGLE_LINE,
      componentData: {}
    },
    {
      icon: 'notes',
      label: 'multiline_text_response',
      componentType: ComponentType.TEXT_MULTI_LINE,
      componentData: {
        multiline: true 
      }
    },
    {
      icon: 'check_circle',
      label: 'select_an_option',
      componentType: ComponentType.OPTIONS,
      componentData: {
        options: cloneDeep(this.defaultOptions)
      }
    },
    {
      icon: 'check_box',
      label: 'select_multiple_options',
      componentType: ComponentType.CHECKBOXES,
      componentData: {
        options: cloneDeep(this.defaultOptions)
      }
    },
    {
      svgIcon: 'option_grid',
      label: 'single_choice_grid',
      componentType: ComponentType.OPTIONS,
      componentData: {
        options: cloneDeep(this.defaultOptions),
        useGrid: true
      }
    },
    {
      icon: 'apps',
      label: 'multiple_choice_grid',
      componentType: ComponentType.CHECKBOXES,
      componentData: {
        options: cloneDeep(this.defaultOptions),
        useGrid: true
      }
    },
    {
      icon: 'arrow_drop_down_circle',
      label: 'dropdown',
      componentType: ComponentType.DROPDOWN,
      componentData: {
        options: cloneDeep(this.defaultOptions)
      }
    },
    {
      icon: 'linear_scale',
      label: 'linear_scale',
      componentType: ComponentType.LINEAR_SCALE,
      componentData: {
        from: 1,
        to: 5
      }
    },
    {
      icon: 'percent',
      label: 'percent',
      componentType: ComponentType.PERCENT,
      componentData: {}
    },
    {
      icon: 'space_bar',
      label: 'range',
      componentType: ComponentType.RANGE,
      componentData: {
        min: 0,
        max: 100
      },
      validationDescKeys: ['note_are_validating_both_values', 'range_with_same_value_not_accepted']
    },
    {
      icon: 'event',
      label: 'date',
      componentType: ComponentType.DATE,
      componentData: {},
      validationDescKeys: ['value_represents_date_seconds']
    },
    {
      icon: 'date_range',
      label: 'date_range',
      componentType: ComponentType.DATE_RANGE,
      componentData: {},
      validationDescKeys: ['value_represents_date_seconds', 'note_are_validating_both_dates', 'start_date_always_less_end_date']
    },
    {
      icon: 'star_rate',
      label: 'rating',
      componentType: ComponentType.RATING,
      componentData: {}
    },
    {
      icon: 'toggle_on',
      label: 'toggle',
      componentType: ComponentType.TOGGLE,
      componentData: {}
    }
  ];

  state: SurveyEditState;
  survey: SurveyImpl;
  pageQuestions: QuestionImpl[] = [];
  currIndex: number;

  imageSrc: string;
  imageLoading = false;

  partPrice: BigNumber;
  keysNum: number;
  loading = false;

  get minStartDate(): Date {
    let currTime = truncateSeconds(new Date(this.web3Service.currenTime)).getTime();
    return new Date(currTime + HOUR_MILLIS);
  };
  get maxStartDate(): Date {
    return new Date(this.minStartDate.getTime() + this.engineProps.startMaxTime * 1000);
  };
  get minEndDate(): Date {
    return new Date(this.survey.startDate.getTime() + this.engineProps.rangeMinTime * 1000);
  };
  get maxEndDate(): Date {
    return new Date(this.minEndDate.getTime() + this.engineProps.rangeMaxTime * 1000);
  };

  get maxParts(): string {
    let budget = new BigNumber(this.state.budgetAmount);// is amount
    let reward = new BigNumber(this.state.rewardAmount);// is amount

    if(budget.isNaN() || !budget.isGreaterThan(0) || reward.isNaN() || !reward.isGreaterThan(0) || budget.isLessThan(reward)) {
      this.keysNum = 0;
      return "-";
    }

    if(!budget.modulo(reward).isEqualTo(0)) {
      this.keysNum = 0;
      return "N/A";
    }

    let result = budget.dividedBy(reward);

    this.keysNum = result.toNumber();
    
    return result.toFixed(0);
  }

  get duration(): string {
    if(!this.survey.startDate || !this.survey.endDate) {
      return "-";
    }

    if(this.survey.endDate.getTime() < this.survey.startDate.getTime()) {
      return "N/A";
    }

    let time = this.survey.endDate.getTime() - this.survey.startDate.getTime();
    return formatDuration(time);
  }

  get newGasReserve(): BigNumber {
    let budget = toUnits(this.state.budgetAmount);
    let reward = toUnits(this.state.rewardAmount);
    return calcGasReserve(budget, reward, this.partPrice);
  }

  get isLowGasReserve(): boolean {
    let gasReserve = toUnits(this.state.gasReserveAmount);
    return gasReserve.isLessThan(this.newGasReserve);
  }

  get keysMax(): number {
    return this.engineProps.hashMaxPerSurvey;
  }

  @ViewChild('destCnt')
  destCnt: ElementRef;

  private onChainLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef
  ) {
    super(element);

    this.state = this.stateService.surveyEditState;

    if(!this.state) {
      this.state = this.stateService.createSurveyEditState();
      this.survey = this.state.survey;

      let question = this.createQuestion(this.availableQuestions[2]);
      this.survey.questions.push(question);

      this.state.budgetAmount = toFixedBigNumber(toAmount(this.survey.budget));
      this.state.rewardAmount = toFixedBigNumber(toAmount(this.survey.reward));
      this.state.gasReserveAmount = '0';
    } else {
      this.survey = this.state.survey;
    }
  }

  // TODO TEMP start

  titles = [
    "A penny saved is a penny earned",
    "Old chestnut",
    "It's better to give than to receive",
    "Magical realism",
    "Ne'er do well",
    "A word in your shell-like",
    "Off with his head",
    "Dock your pay",
    "Behind the eight ball",
    "Bling-bling",
    "Lose face - Save face",
    "Though this be madness, yet there is method in it",
    "Not worth the candle",
    "Chip on your shoulder",
    "Fool's errand",
    "Nail-Biter",
    "Under Your Nose",
    "Blue-plate special",
    "A different kettle of fish",
    "Never-never land",
    "At loggerheads",
    "Wax poetic",
    "Agree to disagree",
    "Cut to the chase",
    "Give up the ghost",
    "Take with a grain of salt",
    "A foot in the door",
    "Full to the gunwales",
    "There is no such thing as bad publicity",
    "Oversexed, overpaid and over here",
    "Go postal",
    "Glass ceiling",
    "Sealed with a loving kiss",
    "Great minds think alike",
    "Penny dreadful",
    "Blue-plate special",
    "Double Dutch",
    "Out of sight",
    "Top drawer",
    "Forbidden fruit",
    "The crapper",
    "As black as a Newgate's knocker",
    "White bread",
    "The devil makes work for idle hands to do",
    "As Busy As a Bee",
    "The usual suspects",
    "A rolling stone gathers no moss",
    "Cut off without a penny",
    "A fly in the ointment",
    "Fly by the seat of one's pants",
    "Woe betide you",
    "High And Dry",
    "Quick On The Draw",
    "High and dry",
    "The belle of the ball",
    "Tawdry",
    "Through thick and thin",
    "Run amok",
    "Fruit of your loins",
    "Walk the plank",
    "Pulling one's leg",
    "Hunt and peck",
    "Bite the dust",
    "A pretty penny",
    "For good measure",
    "The rub of the green",
    "A tissue of lies",
    "Standing on the shoulders of giants",
    "Hindsight Is 20/20",
    "Homonyms",
    "Put a spanner in the works",
    "Rabbit and pork",
    "There are three kinds of lies...",
    "Hocus-pocus",
    "The face that launched a thousand ships",
    "Ball and chain",
    "The birds and the bees",
    "Don't Look a Gift Horse In The Mouth",
    "Say cheese",
    "Nosy parker",
    "Spitting feathers",
    "Alas, poor Yorick! I knew him, Horatio",
    "The customer is always right",
    "Fools' gold",
    "As cold as stone",
    "Someone is walking over my grave",
    "Now is the winter of our discontent",
    "Double Dutch",
    "The crapper",
    "Needle In a Haystack",
    "Bury the hatchet",
    "My old china",
    "As straight as a die",
    "Rest on one's laurels",
    "A fish rots from the head down",
    "Know on which side your bread is buttered",
    "I'll swing for you",
    "The last straw (that broke the camel's back)",
    "As happy as Larry",
    "On the warpath",
    "Cherchez la femme",
    "Salad days",
    "Mutton dressed as lamb",
    "Het up",
    "Cat got your tongue?",
    "Ménage à trois",
    "Fifth estate",
    "Doom and gloom",
    "Fight the good fight",
    "The bread of life"
  ];

  sentences = [
    "We must do what we can to protect vulnerable minorities from attacks.",
    "After an unremarkable stint at Ocean County Community College, he relocated to Asbury Park, a gritty coastal community that scarcely resembled the glitzy seaside resort of its earlier days.",
    "With so many well-financed groups such as Heritage demanding ideological purity, it’s no wonder Boehner waved the white flag in the wake of the personally enriching feat of hosting Pope Francis on Thursday.",
    "What was your SAT score?",
    "Van Gils has found that the bar-tailed godwit, the world’s longest non-stop flier, is also shrinking in both body and bill.",
    "In March, NATO announced that it would hold exercises in western Ukraine at the end of September—exercises that look a lot like practice for a defensive war against a Russian invasion of an Eastern European country.",
    "Volatility—especially for month-to-month earnings and consumption—continues to plague American families.",
    "The problem that home-based primary care addresses has been well understood for years.",
    "And where it will hopefully continue to scare children and other passersby for the foreseeable future.",
    "That’s a much larger gap than the one that exists in the overall labor market, where the median earnings of women were about 83 percent of men's, according to data from the Economic Policy Institute.",
    "Tom told me he was thirty.",
    "Notably, like Pew’s recent poll, PRRI also found that support dipped below 50 percent in two of these polls (with ending field dates of May 18 and August 15) in the past year.",
    "I've got to be an adult about it and recognize it comes with the territory.",
    "THE GHOSTS OF 1994 The great famine finally began to subside in 1998.",
    "To put those 41,638 discrete pieces of communication in perspective, that word count, in the aggregate, is roughly equivalent to a novel that is 166 pages in length.",
    "In the age of exploration, European sailors with coins fought Indian tribesmen with beads.",
    "But the latest use of chemicals by Assad -- perhaps their most extensive deployment since Saddam Hussein killed thousands of Kurds in Halabja -- mandates a response, no matter how ineffective or risky it proves to be.",
    "But if you’re a child molester, there’s no cure, they can’t stop you.",
    "Sailors believed that gunpowder splashed with watered-down liquor wouldn’t combust, while liquor containing more than 50 percent alcohol by weight would cause the powder to flare.",
    "If I’m writing an article about the mitochondrial enzymes sirtuins (which I am!), and I want it to be read by anyone who doesn’t already care about sirtuins, I’ll probably have to get them to care about them by engendering some curiosity in the headline.",
    "“We’re in a highly competitive environment,” Jackson said.",
    "After all, Malt even invested $1 million of Romney's money in a fund run by the candidate's own son, Tagg.",
    "And the two chambers also appear to be on a collision course for how much funding an emergency bill will contain.",
    "National Journal's Beth Reinhard tells us that the president's men and women on the ground in Iowa are making phone calls to would-be voters, because, in Reinhard's words, \"even though Obama is an incumbent running unopposed, Democrats are using Tuesday's caucus as a test run to prepare for the 2012 general election.\" They're also, apparently, using email as a test for Barack Obama's ability to keep in touch with Internet culture.",
    "He brings up Apple as a paradigm for Hollywood.",
    "\"She has assured us that she gave us everything she had, and like we do with other federal employees, we have to depend on them to provide that information to us,\" Barr said.",
    "Because they know better than anyone that the issue could be resurrected at any time.",
    "It's an absolutely charming video and set of photos from a science project by Lauren Rojas, a 13-year-old in Antioch, California, east of San Francisco.",
    "Dean, Tricia and Ben, you are surrounded by love from all of your friends and your precious family.",
    "Poole, Tom Rath, Scott Reed, David Rehr, Tom Reynolds, Steve Roberts, Jason Roe, David Roederer, Dan Schnur, Russ Schriefer, Rich Schwarm, Brent Seaborn, Rick Shelby, Andrew Shore, Kevin Shuvalov, Don Sipple, Ken Spain, Fred Steeper, Bob Stevenson, Terry Sullivan, David Tamasi, Eric Tanenblatt, Richard Temple, Heath Thompson, Jay Timmons, Warren Tompkins, Ted Van Der Meid, Dirk van Dongen, Jan van Lohuizen, Stewart Verdery, Dick Wadhams, John Weaver, Lezlee Westine, Dave Winston, Ginny Wolfe, Fred Wszolek, and Matthew Zablud.",
    "Nationally, amid pitched battles between cops and communities, reports of sniper fire, and conflagrations that consumed business after business, at least 40 people were killed and more than 3,000 were injured in the gravest unrest in America since the Civil War.",
    "By the time he turned 30 in 1958, he was a bona fide academic celebrity.",
    "That is not for me to decide.",
    "Louis Armstrong is rightly lauded as one of the most influential jazz artists of all time, but less frequently appreciated is the impact he had on ending segregation in the United States.",
    "If that’s true, Harvest is his final chance to win.",
    "The scans revealed damage to the anterior temporal lobe of their left hemisphere and the orbitofrontal cortex, regions associated with logic, verbal communication and comprehension.",
    "\"Sean Penn,\" he said, \"Nice to meet you.\" As the drinks flowed, a few other notable guests arrived, includingCongressman Dennis Kucinich, who had been, along with Penn, as avowedan opponent of the Iraq war as Hitch had been a supporter.",
    "Recently, a German team solved the structure of a confusing three-part protein after Ovchinnikov gave them the model that Rosetta had churned out.",
    "\"If not,\" tweeted @TheMissLee, \"they won't have my vote in the future.\" Meanwhile, Paul droned on.",
    "page 36], Susan Glasser (then of Foreign Policy, now of Politico) reported that the burning question in the \"international affairs set\" was, What has Clinton actually done?",
    "Tom Jackson is the brain behind this very innovative car.",
    "He's got to decide if he's going to veto them or not.",
    "It has enumerated andidentified, according to the international disease-classificationsystem, more than 13,600 diagnoses13,600 different ways our bodies canfail.",
    "Because of all the hate email I got from people who thought I hated their dog (contrary to popular blogpinion, I don't really hate corgis, you guys, I just don't understand them).",
    "All earned plaques in Canton.",
    "If she had lived, she would have been 35 years old.",
    "Let's hope that the Democratic commissioners do better.",
    "Friedman: So then, to the question you pose on the cover of your book, do parents matter?",
    "It proved toxic for Democrats back then, and it’s proving toxic again today.",
    "Rita Wilson as Viola Walsh (one of the show's many great recurring attorney adversaries) was deployed wonderfully as a practice examiner designed to get under Cary's skin."
  ];

  questionTitles = [
    "If you could make any fictional character come to life, which would it be?",
    "Would you rather always have to say everything on your mind or never speak again?",
    "What was your favorite subject in school?",
    "Is the glass half empty or half full?",
    "What's the worst and best thing about being female?",
    "What piece of media (book, movie, TV show, etc.) changed the way you viewed the world? In what way?",
    "Jack Nicholson made his debut in the 1958 film what? Cry Baby Killer",
    "If you could go on a cross country road trip with famous person, dead or alive, who would it be?",
    "What piece of clothing or accessory can someone wear that immediately makes you have a bad opinion of them as a person?",
    "Ever used a sex toy or last time you masturbated?",
    "If you had to dedicate a song to both of us, which one would it be?",
    "Do you like any exotic dishes?",
    "What piece of technology brings you the most joy?",
    "When is your mother-in-law's birthday?",
    "If you could call up anyone in the world and have a one hour conversation, who would you call?",
    "How old is the oldest cell in your body?",
    "Do You Have Strong Opinions On Natural Childbirth Verses Medicated Childbirth?",
    "Do the minutes on the movie boxes include the previews, credits, and special features, or just the movie itself?",
    "Do you see us together in another year, 3 years, 5 or so?",
    "Is Carl's Junior a one-star restaurant?",
    "Have you ever done bondage sex (chains,whips,etc.)? If not, would you?",
    "What is the dumbest chorus from a recent song?",
    "Do you hoard money, or save and spend it wisely?",
    "What would be your ideal partner?",
    "Which would you choose: money, or love?",
    "What is the role of the pageant title winner in your mind?",
    "What was the high point of last month?",
    "When was the last time you were sad and why were you sad?",
    "Do You Have A Boyfriend/Girlfriend?",
    "Do you like kissing in public?",
    "What do Greeks say when they don't understand something?",
    "Dumbest Purchase You Ever Made?",
    "Do you like to talk on the phone?",
    "What's a body part that you wouldn't mind losing?",
    "Would you rather be forced to tell your best friend a lie or tell your parents the truth?",
    "Shirley Schrift found fame and success as which actress? Shelly Winters",
    "What piece of technology is really frustrating to use?",
    "Could you ever have an affair with a married person?",
    "Why do they call it \"getting your dog fixed\" if afterwards it doesn't work anymore?",
    "What was the most boring date you've ever been on?",
    "What are some things that sound like compliments but are actually insults?",
    "What actor started his film career as Anglo Saxton type 2008 in the 30s? David Niven",
    "Do you think you're a good judge of character?",
    "Have You Ever Had A Crush On Someone Famous?",
    "If someone has their nose pierced, have a cold, and take their nose ring out. Does snot come out of the piercing hole?",
    "In 1933, what was the first film shown in a drive in theatre? Wife Beware",
    "What's the best piece of advice anyone has ever given you?",
    "How Do I Smell?",
    "How fast do you have to go to keep up with the sun so you're never in darkness?",
    "How often do you meet your parents?",
    "If you have the chance, what would you probably say to your beloved one?",
    "Do You Believe That The Cup Is Half Empty Or Half Full? Give Reasons For Your Answer?",
    "If you could ask your future self one question what would it be?",
    "If you had to rank how attractive you are on 1 to 10 how would you rank yourself?",
    "What would you say your biggest fear is when it comes to relationships?",
    "What's the worst chatup line you've heard?",
    "First kiss?",
    "How long did your most intimate relationship last?",
    "Name 1 thing you miss about being a kid.",
    "What does it mean to you to allow another person to fully love you?",
    "Has a friend ever made you cry?",
    "\"It's all good\" ... was that Nietzsche?",
    "What did you think of me when you first met me?",
    "How much spam email do you tend to get a week?",
    "Is journalism dying or becoming more important?",
    "Would you rather kiss a jellyfish or step on a crab?",
    "What makes you angry?",
    "What will immediately disqualify a potential SO?",
    "What are your habits?",
    "How do you feel if you accidentally leave your phone at home?",
    "If you could go back in time to change one thing what would it be?",
    "What would be your dream sandwich?",
    "Would you rather sweat moderately but constantly 24 hours a day all over your body or have a metal pin in your jaw that constantly picks up talk radio stations?",
    "Who is your favorite actress?",
    "Describe to me the perfect date?",
    "Have you ever have sex for money?",
    "What is your spouse's favorite snack?",
    "If you add your username to your ignore list, would you not be able to read your own posts?",
    "William Hurt won the best actor Oscar for what 1985 movie? The Kiss of the Spiderwoman",
    "How are you enjoying this time with me?",
    "What is your spouse's favorite TV show?",
    "Why do fat chance and slim chance mean the same thing?",
    "Name all the people who are closest to your partner.",
    "At What Point Does A Girl Become A Woman?",
    "What was the last funny video you saw?",
    "Would you rather have hands that kept growing as you got older or feet that kept growing as you got older?",
    "What's your favourite personality trait you like about yourself?",
    "Have you ever been excluded from school?",
    "What's one of your favorite habits you have?",
    "What are three occupations that machines will soon replace?",
    "What do you think of right before bedtime?",
    "When and where did you first kiss?",
    "What belief do you have that most people disagree with?",
    "Are you a good aim with a rubber band?",
    "What are 3 unique things about you?",
    "Do you smoke?",
    "What do you call male ballerinas?",
    "Would you rather be infamous in history books or be forgotten after your death?",
    "Would you rather have a missing finger or an extra toe?",
    "When and how was the last time you told someone HONESTLY how you felt? when was it? during the day. how was it?"
  ];
  
  // TODO TEMP end

  onInit() {
    if(!this.survey.title) {
      this.survey.title = this.translateService.instant('untitled_survey');
    }

    // TODO TEMP start

    if (this.survey.questions.length <= 1) {
      let questionIndex = randomIntFromInterval(0, this.questionTitles.length-1);
      this.survey.questions[0].content.title = this.questionTitles[questionIndex];

      //for(let i = 0; i < 7; i++) {
      for (let type of this.availableQuestions) {
        let question = this.createQuestion(type);
        questionIndex = randomIntFromInterval(0, this.questionTitles.length-1);
        question.content.title = this.questionTitles[questionIndex];
        this.survey.questions.splice(this.survey.questions.length, 0, question);
      }
      //}
    }

    let titleIndex = randomIntFromInterval(0, this.titles.length-1);
    let sentenceIndex = randomIntFromInterval(0, this.sentences.length-1);
    this.survey.title = 'Random Test Survey: ' + this.titles[titleIndex];
    this.survey.description = this.sentences[sentenceIndex];
    //this.setPartKeys(100);
    this.survey.startDate = new Date(truncateSeconds(new Date()).getTime() + HOUR_MILLIS * randomIntFromInterval(1, 24));
    this.survey.endDate = new Date(truncateSeconds(new Date()).getTime() + DAY_MILLIS * randomIntFromInterval(7, 365));
    let randBudget = randomIntFromInterval(100, 100000);
    this.state.budgetAmount = randBudget + '';
    this.state.rewardAmount = (randBudget / 100) + '';

    // TODO TEMP end

    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadPartPrice();
    }, () => {
      return this.loadedChainData;
    });
    
    this.loadImageSrc();
    this.loadPage();
  }

  onViewLoaded() {
  }

  onDestroy() {
    if(this.onChainLoadedRemover)
    this.onChainLoadedRemover();
  }

  hasImage() {
    return this.survey.logoUrl || this.survey.imageData;
  }

  onChangeLogoUrl(url: string) {
    this.survey.imageData = undefined;
    this.imageSrc = undefined;

    if(isIpfsUri(url)) {
      this.loadImageSrc();
    }
  }

  onSelectImage(event: any) { // called each time file input changes
    this.survey.imageData = undefined;
    this.survey.logoUrl = undefined;
    this.imageSrc = undefined;

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.imageLoading = true;

      const reader = new FileReader();
      reader.readAsDataURL(file); // read file as data url

      reader.onload = (event) => { // called once readAsDataURL is completed
        let image = event.target?.result as string;
        let sizeMB = file.size / 1024 / 1024;

        if (sizeMB > 1) {
          // resize to 1MB
          let maxSize = 512; // https://jan.ucc.nau.edu/lrm22/pixels2bytes/calculator.htm
          resizeBase64Image(image, maxSize, maxSize).then((result) => {
            sizeMB = lengthBase64(result) / 1024 / 1024;

            if (sizeMB > 1) {
              insertValidationError(".survey-logo-error", this.translateService.instant("logo_size_exceeds_limit"));
            } else {
              this.survey.imageData = result;
            }
            
            this.imageLoading = false;
            this.loadImageSrc();
          });
        } else {
          this.survey.imageData = image;
          this.imageLoading = false;
          this.loadImageSrc();
        }
      };
    }
  }

  onChangeBudget() {
    this.loadGasReserve();
  }

  onChangeReward() {
    this.loadGasReserve();
  }

  onChangeGasReserve() {
  }

  loadGasReserve() {
    this.state.gasReserveAmount = toFixedBigNumber(toAmount(this.newGasReserve));
  }

  setPartKeys(num: number) {
    if(num > this.keysMax) {
      this.keysNum = num = this.keysMax;
    }

    this.survey.partKeys = [];

    for(let i = 0; i < num; i++) {
      this.survey.partKeys[i] = uuidv4();
    }
  }

  createQuestion(questionType: QuestionType) {
    let newQuestion: QuestionImpl = {
      content: {
        title: this.translateService.instant("question") + ' ' + (this.survey.questions.length + 1),
        componentType: questionType.componentType,
        componentData: cloneDeep(questionType.componentData)
      },
      viewId: uniqueId(),
      mandatory: true,
      validators: [],
      validationDescKeys: questionType.validationDescKeys,
      response: {}
    };

    return newQuestion;
  }

  createQuestionPreview(questionType: QuestionType) {
    let preview = questionType.preview;

    if (!preview) {
      let question = this.createQuestion(questionType);
      preview = questionType.preview = new DynamicItem(QuestionImplComponent, {
        question: question,
        width: $(this.destCnt.nativeElement).width() - 20
      });
    }

    return preview;
  }

  onSourceListExited(event: CdkDragExit<any>) {
    this.currIndex = event.container._dropListRef.getItemIndex(event.item._dragRef);
    this.availableQuestions.splice(this.currIndex, 0, this.availableQuestions[this.currIndex]);
  }

  onSourceListEntered(event: CdkDragEnter<any>) {
    this.availableQuestions.splice(this.currIndex, 1);
  }

  noReturnPredicate() {
    return false;
  }

  onDestDropped(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      let questionType = event.previousContainer.data[event.previousIndex];
      let newQuestion = this.createQuestion(questionType);

      event.previousContainer.data.splice(event.previousIndex, 1);
      event.container.data.splice(event.currentIndex, 0, newQuestion);

      let start = this.state.paginatorData.first;
      this.survey.questions.splice(start + event.currentIndex, 0, newQuestion);

      let nextPage = Math.ceil((start + event.currentIndex + 1) / this.state.paginatorData.rows) - 1;
      this.loadPageToScroll(nextPage, newQuestion.viewId);
    }
  }

  canAddQuestion() {
    return this.survey.questions.length < this.engineProps.questionMaxPerSurvey;
  }

  addQuestion(questionType: QuestionType) {
    let newQuestion = this.createQuestion(questionType);
    this.survey.questions.splice(this.survey.questions.length, 0, newQuestion);

    let nextPage = Math.ceil(this.survey.questions.length / this.state.paginatorData.rows) - 1;
    this.loadPageToScroll(nextPage, newQuestion.viewId);
  }

  duplicateQuestion(viewId: string) {
    let index = this.survey.questions.findIndex(q => q.viewId == viewId);
    let newQuestion = cloneDeep(this.survey.questions[index]);
    newQuestion.viewId = uniqueId();
    this.survey.questions.splice(index+1, 0, newQuestion);

    let nextPage = Math.ceil((index+2) / this.state.paginatorData.rows) - 1;
    this.loadPageToScroll(nextPage, newQuestion.viewId);
  }

  removeQuestion(viewId: string) {
    //this.survey.questions.splice(index, 1);
    let index = this.survey.questions.findIndex(q => q.viewId == viewId);
    $(`#${viewId} button`).each(function(i: number, elem: any) {
      this.disabled = true;
    });

    let comp = this;
    /*$(`#${viewId}`).fadeOut(500, function() {
      comp.survey.questions.splice(index, 1);
      comp.loadPage();
    });*/

    $(`#${viewId}`).animate({ height: 0, opacity: 0 }, 500, function() {
      // Animation complete.
      comp.survey.questions.splice(index, 1);
      comp.loadPage();
    });
  }

  onPageChange(event: any) {
    this.state.paginatorData = event;
    let comp = this;

    $('.dest-list').fadeTo(100, 0.01, function() {
        comp.loadPage();
        $(this).fadeTo(1000, 1);
    });
  }

  loadSurveyPreview() {
    this.loading = true;
    const validation = this.validateSurvey();

    if(validation) {
      let elemId = validation[0];
      let errMsg = validation[1];
      let qIndex = validation[2];
      let scrollPos = validation[3];// Not indicated

      this.validationError(elemId, errMsg, qIndex, scrollPos);
      this.loading = false;
      return;
    }

    let gasReserve = toUnits(this.state.gasReserveAmount);
    let budget = toUnits(this.state.budgetAmount);
    let reward = toUnits(this.state.rewardAmount);
    /*let totalFee = calcFeeTotal(budget, reward, this.engineProps.feeWei);
    let weiAmount = gasReserve.plus(totalFee);

    if(weiAmount.isGreaterThan(this.accountData.ccyBalance)) {
      this.messageService.add({
        severity:'error', 
        summary: this.translateService.instant("error"),
        detail: this.translateService.instant("insufficient_x_balance", { val1: this.currSymbol })
      });

      this.loading = false;
      return;
    }*/

    this.survey.budget = budget;
    this.survey.reward = reward;
    this.survey.gasReserve = gasReserve;
    this.state.validated = true;
    this.router.navigate(['/create-survey/preview']);

    this.loading = false;
  }

  private async loadImageSrc() {
    this.imageSrc = await this.ipfsService.surveyLogo(this.survey);
  }

  private async loadPartPrice() {
    this.partPrice = await this.surveyService.calcPartPrice();
    this.loadGasReserve();
  }

  private loadPage(nextPage: number = undefined, selector: string = undefined, callback: () => void = undefined) {
    this.pageQuestions = loadPageList(this.survey.questions, this.state.paginatorData, nextPage, selector, callback);
  }

  private loadPageToScroll(nextPage: number, viewId: string) {
    this.loadPage(nextPage, `#${viewId}`, () => {
      moveScrollTo(`#${viewId}`, 'top', -10);
    });
  }

  private validationError(elemId: string, errMsg: string, qIndex: number = undefined, scrollPos: ScrollPosition = 'center') {
    if(qIndex >= 0) {
      let nextPage = Math.ceil((qIndex+1) / this.state.paginatorData.rows) - 1;
      this.loadPage(nextPage, elemId, () => {
        insertValidationError(elemId, errMsg, scrollPos);
      });
    } else {
      insertValidationError(elemId, errMsg, scrollPos);
    }
  }

  private validateSurvey(): [string, string] | [string, string, number] | [string, string, number, ScrollPosition] {

     this.survey.title = this.survey.title.trim();
     this.survey.description = this.survey.description?.trim();

     // logo is optional
    if(this.survey.logoUrl) {
      if(this.survey.logoUrl.length > this.engineProps.urlMaxLength) {
        return [".survey-logo-error", this.translateService.instant("url_too_long_max_x_chars", { val1: this.engineProps.urlMaxLength })];
      }

      let isIpfs = isIpfsUri(this.survey.logoUrl);

      if(!isIpfs && !isValidHttpUrl(this.survey.logoUrl)) {
        return [".survey-logo-error", this.translateService.instant("invalid_url")];
      }

      if((!isIpfs && !isImageUrl(this.survey.logoUrl)) || (isIpfs && !isImageData(this.imageSrc))) {
        return [".survey-logo-error", this.translateService.instant("url_is_not_image")];
      }
    }

    if(isEmpty(this.survey.title)) {
      return [".survey-title", this.translateService.instant("please_enter_title")];
    }

    if(this.survey.title.length > this.engineProps.titleMaxLength) {
      return [".survey-title", this.translateService.instant("invalid_title_max_x_chars", { val1: this.engineProps.titleMaxLength })];
    }

    // description is optional
    if(this.survey.description && this.survey.description.length > this.engineProps.descriptionMaxLength) {
      return [".survey-description", this.translateService.instant("invalid_description_max_x_chars", { val1: this.engineProps.descriptionMaxLength })];
    }

    let currTime = truncateSeconds(new Date(this.web3Service.currenTime)).getTime();

    if(!this.survey.startDate) {
      return [".survey-start-date", this.translateService.instant("please_enter_start_date")];
    }

    if(this.survey.startDate.getTime() < currTime + HOUR_MILLIS) {
      return [".survey-start-date", this.translateService.instant("start_date_must_after_current_date_at_least_1_hour")];
    }

    if(this.survey.startDate.getTime() - currTime > this.engineProps.startMaxTime * 1000) {
      return [".survey-start-date", this.translateService.instant("invalid_start_date_max_x_days", { val1: Math.round(this.engineProps.startMaxTime / 60 / 60 / 24) })];
    }

    if(!this.survey.endDate) {
      return [".survey-end-date", this.translateService.instant("please_enter_end_date")];
    }

    if(this.survey.endDate.getTime() < this.survey.startDate.getTime() + this.engineProps.rangeMinTime * 1000) {
      return [".survey-end-date", this.translateService.instant("invalid_date_range_min_x_hours", { val1: Math.round(this.engineProps.rangeMinTime / 60 / 60 ) })];
    }

    if(this.survey.endDate.getTime() - this.survey.startDate.getTime() > this.engineProps.rangeMaxTime * 1000) {
      return [".survey-end-date", this.translateService.instant("invalid_date_range_max_x_days", { val1: Math.round(this.engineProps.rangeMaxTime / 60 / 60 / 24) })];
    }

    let budget = toUnits(this.state.budgetAmount);

    if(budget.isNaN() || !budget.isGreaterThan(0)) {
      return [".survey-budget", this.translateService.instant("please_enter_valid_budget")];
    }

    if(budget.isGreaterThan(this.accountData.incBalance)) {
      return [".survey-budget", this.translateService.instant("budget_exceeds_your_x_balance", { val1: 'INC' })];
    }

    let reward = toUnits(this.state.rewardAmount);

    if(reward.isNaN() || !reward.isGreaterThan(0)) {
      return [".survey-reward", this.translateService.instant("please_enter_valid_reward")];
    }

    if(reward.isGreaterThan(budget)) {
      return [".survey-reward", this.translateService.instant("reward_exceeds_budget")];
    }

    if(!budget.modulo(reward).isEqualTo(0)) {
      return [".survey-budget", this.translateService.instant("wrong_number_participations")];
    }

    let partsNum = budget.dividedBy(reward).toNumber();

    if(this.survey.partKeys && this.survey.partKeys.length > 0 && this.survey.partKeys.length != partsNum) {
      return [".survey-keys-error", this.translateService.instant("wrong_number_coupons")];
    }

    let gasReserve = toUnits(this.state.gasReserveAmount);

    if(gasReserve.isNaN() || gasReserve.isLessThan(0)) {
      return [".survey-gas-reserve", this.translateService.instant("please_enter_valid_gas_reserve")];
    }

    if(gasReserve.isGreaterThan(this.accountData.ccyBalance)) {
      return [".survey-gas-reserve", this.translateService.instant("gas_reserve_exceeds_your_x_balance", { val1: this.currSymbol })];
    }

    if(this.survey.questions.length == 0) {
      return [".dest-cnt-error", this.translateService.instant("please_enter_questions")];
    }

    if(this.survey.questions.length > this.engineProps.questionMaxPerSurvey) {
      return [".dest-cnt-error", this.translateService.instant("number_questions_exceeds_limit_x", { val1: this.engineProps.questionMaxPerSurvey })];
    }

    for(let i = 0; i < this.survey.questions.length; i++) {
      let question = this.survey.questions[i];
      let elemId = "#question-error-" + question.viewId;

      question.content.title = question.content.title.trim();

      if(isEmpty(question.content.title)) {
        return [elemId, this.translateService.instant("please_ask_the_question"), i];
      }

      let json = JSON.stringify(question.content);
      //console.log("question.content: " + json);

      if(json.length > this.engineProps.questionMaxLength) {
        return [elemId, this.translateService.instant("very_long_question_reduce"), i];
      }

      if(question.validators.length > this.engineProps.validatorMaxPerQuestion) {
        return [elemId, this.translateService.instant("number_validators_exceeds_limit_x", { val1: this.engineProps.validatorMaxPerQuestion }), i];
      }

      let responseType = RESPONSE_TYPE[question.content.componentType];

      for(let j = 0; j < question.validators.length; j++) {
        let validator = question.validators[j];

        if(validator.expression == ValidationExpression.None) {
          return [elemId, this.translateService.instant("validator_error_select_expression"), i];
        }

        if(j < (question.validators.length - 1) && validator.operator == ValidationOperator.None) {
          return [elemId, this.translateService.instant("validator_error_select_operator"), i];
        }

        if(validator.expression != ValidationExpression.Empty && validator.expression != ValidationExpression.NotEmpty && 
          validator.expression != ValidationExpression.ContainsDigits && validator.expression != ValidationExpression.NotContainsDigits) {
            if(isEmpty(validator.value)) {
              return [elemId, this.translateService.instant("validator_error_indicates_value"), i];
            }

            if(validator.value.length > this.engineProps.validatorValueMaxLength) {
              return [elemId, this.translateService.instant("invalid_validator_value_max_x_chars", { val1: this.engineProps.validatorValueMaxLength }), i];
            }

            if(validator.expression == ValidationExpression.Greater || validator.expression == ValidationExpression.GreaterEquals || 
              validator.expression == ValidationExpression.Less || validator.expression == ValidationExpression.LessEquals || 
              responseType == ResponseType.Number || responseType == ResponseType.ArrayNumber || 
              responseType == ResponseType.Range) {
                if(!isDigit(validator.value)) {
                  return [elemId, this.translateService.instant("validator_value_must_be_integer"), i];
                }

                  // Fix validator value: 0001 = 1
                validator.value = parseInt(validator.value).toString();
            }
            
            if(validator.expression == ValidationExpression.MinLength || validator.expression == ValidationExpression.MaxLength || 
              responseType == ResponseType.Percent || responseType == ResponseType.Rating || 
              responseType == ResponseType.Date || responseType == ResponseType.ArrayDate || 
              responseType == ResponseType.DateRange) {
                if(!isUDigit(validator.value)) {
                  return [elemId, this.translateService.instant("validator_value_must_be_positive_integer"), i];
                }

                // Fix validator value: 0001 = 1
                validator.value = parseInt(validator.value).toString();
            }
        } else if(validator.value) {
          throw new Error("The validator does not require any value");
        }
      }

      if(question.content.componentData.options) {
        let labels = {};

        for(let option of question.content.componentData.options) {
          if (labels[option.label]) {
            // we have already found this same id
            return [elemId, this.translateService.instant("duplicate_options_not_allowed"), i];
          } else {
            labels[option.label] = true;
          }
        }
      }
    }

    return null;
  }
}
