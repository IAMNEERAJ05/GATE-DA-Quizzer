/* GATE DA syllabus as a checklist.
   Each subject -> topics -> concept units. Every unit should be covered by at least one card.
   Unit keys are referenced by cards (u:'unit') and by tagged paper questions (data/papers.js). */
window.SUBJECTS = [
{ id:'ps', name:'Probability & Statistics', short:'P&S', topics:[
  {id:'count', name:'Counting', units:{
    perm:'Permutations', comb:'Combinations', rep:'Selections with repetition (stars and bars)',
    arr:'Circular and repeated-item arrangements', func:'Counting functions and bijections'}},
  {id:'axioms', name:'Axioms & events', units:{
    axioms:'Axioms, sample space, events', classical:'Equally likely outcomes', addrule:'Addition rule, inclusion–exclusion',
    compl:'Complement rule', indep:'Independent events', mutex:'Mutually exclusive vs independent'}},
  {id:'cond', name:'Conditional & Bayes', units:{
    condp:'Conditional probability', chain:'Multiplication (chain) rule', total:'Law of total probability',
    bayes:'Bayes’ theorem', jointpdf:'Joint, marginal and conditional PDFs'}},
  {id:'desc', name:'Descriptive statistics', units:{
    central:'Mean, median, mode', spread:'Variance and standard deviation', affine:'Effect of shifting and scaling',
    zscore:'z-score normalisation', update:'Updating summaries with new data'}},
  {id:'covr', name:'Covariance & correlation', units:{
    cov:'Covariance', corr:'Correlation coefficient', varsum:'Variance of sums and linear combinations',
    indepcorr:'Uncorrelated vs independent'}},
  {id:'rv', name:'Random variables & CDF', units:{
    pmf:'Valid PMF / PDF', cdf:'CDF properties and use', expect:'Expectation and linearity',
    var:'Variance of a random variable', transform:'Functions of random variables'}},
  {id:'cexp', name:'Conditional expectation', units:{
    condexp:'Conditional expectation', tower:'Law of total expectation', condvar:'Conditional and total variance',
    firststep:'First-step analysis (expected waiting)'}},
  {id:'disc', name:'Discrete distributions', units:{
    dunif:'Discrete uniform', bern:'Bernoulli', binom:'Binomial', poisson:'Poisson', geom:'Geometric', hyper:'Hypergeometric'}},
  {id:'cont', name:'Continuous distributions', units:{
    cunif:'Continuous uniform', expo:'Exponential', normal:'Normal and standard normal',
    tdist:'t-distribution', chisq:'Chi-squared distribution'}},
  {id:'samp', name:'Sampling & CLT', units:{
    clt:'Central limit theorem', se:'Sampling distribution of the mean', estim:'Estimators: bias, MLE', ineq:'Markov and Chebyshev inequalities'}},
  {id:'inf', name:'Estimation & tests', units:{
    ci:'Confidence intervals', ztest:'z-test', ttest:'t-test', chitest:'Chi-squared test',
    htbasics:'Errors, α and p-values'}}
]},
{ id:'la', name:'Linear Algebra', short:'LA', topics:[
  {id:'vs', name:'Vector spaces', units:{
    subsp:'Subspace test', lindep:'Linear dependence and independence', basis:'Basis and dimension',
    ortho:'Orthogonality and orthonormal sets', gramschmidt:'Gram–Schmidt orthogonalisation'}},
  {id:'mat', name:'Matrices', units:{
    matops:'Matrix algebra, transpose, inverse', trace:'Trace', symm:'Symmetric and Gram matrices',
    partition:'Partitioned (block) matrices', rank1:'Outer products uuᵀ'}},
  {id:'special', name:'Special matrices', units:{
    orthmat:'Orthogonal matrices', idem:'Idempotent matrices', projmat:'Projection matrices'}},
  {id:'det', name:'Determinant', units:{det:'Determinant properties', detcalc:'Computing determinants (2×2, 3×3, triangular, block)', adj:'Cofactors, adjugate and Cramer’s rule'}},
  {id:'rank', name:'Rank & nullity', units:{
    rank:'Rank', nullity:'Nullity and rank–nullity', fourspaces:'Four fundamental subspaces'}},
  {id:'sys', name:'Linear systems', units:{
    systems:'Consistency of Ax = b', homog:'Homogeneous systems', gauss:'Gaussian elimination'}},
  {id:'eig', name:'Eigenvalues', units:{
    eigdef:'Characteristic polynomial', eigprop:'Trace and determinant from eigenvalues',
    eigpoly:'Eigenvalues of Aᵏ, A⁻¹, p(A)', eigspecial:'Eigenvalues of special matrices',
    diag:'Diagonalisation', cayley:'Cayley–Hamilton'}},
  {id:'qf', name:'Quadratic forms', units:{
    quadform:'Quadratic forms and definiteness', rayleigh:'Rayleigh quotient (max/min of xᵀAx)'}},
  {id:'proj', name:'Projections & least squares', units:{
    projvec:'Projection onto a vector or subspace', lsq:'Least squares and normal equations'}},
  {id:'dec', name:'Decompositions', units:{lu:'LU decomposition', svd:'Singular value decomposition'}}
]},
{ id:'calc', name:'Calculus & Optimization', short:'Calc', topics:[
  {id:'lim', name:'Limits', units:{limits:'Standard limits', lhopital:'L’Hôpital’s rule', series:'Series and sums'}},
  {id:'cd', name:'Continuity & differentiability', units:{
    continuity:'Continuity', diffb:'Differentiability', rules:'Derivative rules', mvt:'Rolle’s and mean value theorems'}},
  {id:'taylor', name:'Taylor series', units:{taylor:'Taylor and Maclaurin series'}},
  {id:'opt', name:'Maxima & minima', units:{
    crit:'Critical points and derivative tests', global:'Global extrema and convexity', appl:'Single-variable optimisation problems'}}
]},
{ id:'dsa', name:'Programming, DS & Algorithms', short:'DSA', topics:[
  {id:'py', name:'Python', units:{pybasics:'Python semantics', pyrec:'Recursion tracing'}},
  {id:'ds', name:'Data structures', units:{
    stack:'Stacks', queue:'Queues and deques', list:'Linked lists', tree:'Binary trees and traversals', bst:'Binary search trees', hash:'Hash tables'}},
  {id:'search', name:'Searching', units:{linsearch:'Linear search', binsearch:'Binary search'}},
  {id:'sort', name:'Sorting', units:{elemsort:'Selection, bubble, insertion sort', merge:'Merge sort', quick:'Quick sort'}},
  {id:'graph', name:'Graphs', units:{gbasics:'Graph basics', bfs:'Breadth-first search', dfs:'Depth-first search, topological sort', sp:'Shortest paths'}},
  {id:'cx', name:'Complexity', units:{asym:'Asymptotic notation', recur:'Recurrence relations'}}
]},
{ id:'db', name:'Databases & Warehousing', short:'DBMS', topics:[
  {id:'er', name:'ER model', units:{ermodel:'ER model to relations'}},
  {id:'rel', name:'Relational model & SQL', units:{relalg:'Relational algebra', trc:'Tuple relational calculus', sql:'SQL queries'}},
  {id:'ic', name:'Keys & constraints', units:{keys:'Keys and superkeys', fk:'Integrity constraints'}},
  {id:'norm', name:'Normalisation', units:{fd:'Functional dependencies and closure', nf:'Normal forms', decomp:'Decomposition properties'}},
  {id:'file', name:'Files & indexing', units:{fileorg:'File organisation', index:'Indexing and B+ trees'}},
  {id:'dt', name:'Data transformation', units:{dtypes:'Data types', dtrans:'Normalisation, discretisation, sampling, compression'}},
  {id:'dw', name:'Data warehousing', units:{schema:'Star, snowflake and fact-constellation schemas', hier:'Concept hierarchies', olap:'OLAP operations and cubes', measures:'Measures and their computation'}}
]},
{ id:'ml', name:'Machine Learning', short:'ML', topics:[
  {id:'reg', name:'Regression', units:{linreg:'Simple and multiple linear regression', ridge:'Ridge regression', logreg:'Logistic regression'}},
  {id:'cls', name:'Classification', units:{knn:'k-nearest neighbour', nb:'Naive Bayes', lda:'Linear discriminant analysis', svm:'Support vector machines', dtree:'Decision trees'}},
  {id:'eval', name:'Model evaluation', units:{biasvar:'Bias–variance trade-off', cv:'Cross-validation', metrics:'Accuracy, precision, recall, ROC'}},
  {id:'nn', name:'Neural networks', units:{perceptron:'Perceptron and linear separability', mlp:'MLP and parameter counts', act:'Activation functions', backprop:'Gradients and gradient descent'}},
  {id:'unsup', name:'Unsupervised learning', units:{kmeans:'k-means and k-medoid', hclust:'Hierarchical clustering and linkage', pca:'Principal component analysis'}}
]},
{ id:'ai', name:'Artificial Intelligence', short:'AI', topics:[
  {id:'search', name:'Search', units:{uninf:'Uninformed search', inf:'Informed search and A*', adv:'Minimax and alpha–beta pruning'}},
  {id:'logic', name:'Logic', units:{prop:'Propositional logic', fol:'Predicate (first-order) logic'}},
  {id:'unc', name:'Reasoning under uncertainty', units:{ci:'Conditional independence and Bayes nets', ve:'Exact inference: variable elimination', samp:'Approximate inference: sampling'}}
]},
/* General Aptitude: common to every GATE paper. noMatch: no matching rounds (rules are sentences, not formulas). */
{ id:'ga', name:'General Aptitude', short:'GA', deck:'Rules & formulas', noMatch:true, topics:[
  {id:'gram', name:'Grammar', units:{
    sva:'Subject–verb agreement', tense:'Tenses', article:'Articles', prep:'Prepositions', conj:'Conjunctions and connectors',
    adjadv:'Adjectives, adverbs and comparison', pron:'Pronouns', condl:'Conditionals and modals', parallel:'Parallelism and modifiers'}},
  {id:'vocab', name:'Vocabulary & idioms', units:{
    confused:'Commonly confused words', context:'Words in context and intensity order', idiom:'Idioms and phrasal verbs', analogy:'Verbal analogies'}},
  {id:'reason', name:'Reading & inference', units:{
    infer:'Inference vs assumption ("based only on")', condinf:'What conditional sentences imply', seq:'Narrative sequencing'}},
  {id:'logic', name:'Logical reasoning', units:{
    syllog:'Categorical statements and syllogisms', code:'Coding–decoding', relation:'Blood relations', direction:'Directions and maps', puzzle:'Arrangements, tournaments and puzzles'}},
  {id:'arith', name:'Arithmetic', units:{
    pct:'Percentages and successive change', ratio:'Ratio and proportion', avg:'Averages', profit:'Profit, loss and discount',
    interest:'Simple and compound interest', mix:'Mixtures and alligation'}},
  {id:'rate', name:'Time, work & speed', units:{work:'Time and work, pipes', speed:'Speed, distance, trains and boats'}},
  {id:'num', name:'Numbers & algebra', units:{
    numth:'Divisibility, HCF/LCM, primes and digits', powlog:'Powers, exponents and logarithms', series:'Series and sequences', alg:'Equations, roots and function behaviour'}},
  {id:'cp', name:'Counting, probability & statistics', units:{
    pnc:'Permutations and combinations', prob:'Elementary probability', stats:'Mean, median and mode', sets:'Sets and Venn diagrams'}},
  {id:'geo', name:'Mensuration & geometry', units:{
    plane:'Plane figures: areas, angles, circles', solid:'Solids: surface area and volume', scale:'Scaling effects on length, area and volume'}},
  {id:'di', name:'Data interpretation', units:{ditab:'Tables, bar charts and histograms', dipie:'Pie charts and percentage shares'}},
  {id:'nr', name:'Numerical reasoning', units:{clock:'Clocks', calendar:'Calendars', ages:'Ages'}},
  {id:'spatial', name:'Spatial aptitude', units:{
    transform:'Rotation, reflection and symmetry', fold:'Paper folding and cutting', dice:'Dice and cube nets', cubecut:'Cutting and painting cubes', colour:'Map colouring'}}
]}
];

window.BANK = [];
/* addCards(subjectId, cards): scopes ids and stores the subject on each card */
window.addCards = function(s, cards){
  for (const c of cards){ c.s = s; c.id = s + '.' + c.id; window.BANK.push(c); }
};
