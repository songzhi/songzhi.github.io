---
tags:
  - python
  - tech
date: "2020-3-04 20:44:40"
---

# 【译】「结构化并发」简析，或：有害的go语句

[原博文（@vorpalsmith）](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)

每种并发API都有其并发执行代码的方式。下面是几个看上去使用了不同API的例子：

```
go myfunc();                                // Golang

pthread_create(&thread_id, NULL, &myfunc);  /* C with POSIX threads */

spawn(modulename, myfuncname, [])           % Erlang

threading.Thread(target=myfunc).start()     # Python with threads

asyncio.create_task(myfunc())               # Python with asyncio
```

符号和术语的区别不影响语义的一致：它们都安排`myfunc`开始与程序的其余部分并发运行，然后立即返回以便父程序执行其他操作。

另一种选择是使用回调：

```
QObject::connect(&emitter, SIGNAL(event()),        // C++ with Qt
                 &receiver, SLOT(myfunc()))

g_signal_connect(emitter, "event", myfunc, NULL)   /* C with GObject */

document.getElementById("myid").onclick = myfunc;  // Javascript

promise.then(myfunc, errorhandler)                 // Javascript with Promises

deferred.addCallback(myfunc)                       # Python with Twisted

future.add_done_callback(myfunc)                   # Python with asyncio
```

情况依旧，符号不同但是效果一样：从现在起，如果特定事件发生，执行`myfunc`。一旦设定完毕，就立即返回以便调用者执行其他操作。（有时候回调被包装得很漂亮，例如 [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) [combinators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race), or [Twisted-style protocols/transports](https://twistedmatrix.com/documents/current/core/howto/servers.html)，但是核心概念一样。）

然后……没了。随便找一个实际的例子，你会发现它不是属于前者就是后者，要么就是兼而有之，比如asyncio。

但是我（原博主@vorpalsmith）的新库 [Trio](https://trio.readthedocs.io/)有点怪，它两种方法都不用。取而代之的是，如果我们想并行运行`myfunc`和`anotherfunc`，这样写：

```Python
async with trio.open_nursery() as nursery:
    nursery.start_soon(myfunc)
    nursery.start_soon(anotherfunc)
```

当人们首次遇到这种“nursery”(nursery，托儿所)结构时，他们会有点困惑。为什么有一个缩进块？这个`nursery`对象是什么东西，还有为什么派生任务之前还得有它？他们又会发现，别的框架里得心应手的模式在这没法用了，就很恼火。它看起来古怪又独特，而且因为抽象层次过高也很难成为一个基本原语。这些反应都可以理解。但请容忍我。

**在这篇文章里，我想告诉你nursery模式一点也不古怪，而是一个像for循环或者函数调用一样基本的新控制流原语。更进一步，我们之前看到的其他方法——线程派生，回调注册——统统都不需要，而且能换成nursery式写法**

听起来不太可能？其实这样的事情屡见不鲜：`goto`语句曾是个王者，现在是个[笑话](https://xkcd.com/292/)。只有少数语言还有一些类`goto`语句，但仍然不同于且远弱于原本的`goto`。大多数语言甚至有都没有。大多数人甚至都不知道这陈芝麻烂谷子的事。但是彼时彼刻，恰如此时此刻。`goto`如是，并发API亦如是。

## 什么是`goto`?

让我们回顾段历史：早期计算机用 [汇编语言](https://en.wikipedia.org/wiki/Assembly_language)编程，或者别的甚至更基本的原语。这有点糟糕。所以在1950年代， 一些人像IBM的[John Backus](https://en.wikipedia.org/wiki/John_Backus) 还有Remington Rand的 [Grace Hopper](https://en.wikipedia.org/wiki/Grace_Hopper)开发了 [FORTRAN](https://en.wikipedia.org/wiki/Fortran)和 [FLOW-MATIC](https://en.wikipedia.org/wiki/FLOW-MATIC)（更为知名的是他的直接继承者 [COBOL](https://en.wikipedia.org/wiki/COBOL)）等等语言。

FLOW-MATIC当年野心勃勃。可以将它看作Python的曾曾曾……祖父：第一门“以人为本"的语言。下面是一些FLOW-MATIC的代码，你细品：

![](http://cdn.lsongzhi.cn/blog/flow-matic-1.svg)

和现代语言不同，它没有`if`块，循环块，或者函数调用。实际上它根本没有块分隔符或缩进，就是一列线性语句。这不是因为这个程序恰好不需要任何花哨的控制语法，而是块语法根本还没发明呢！

![](http://cdn.lsongzhi.cn/blog/sequential-and-go-to-schematic.svg)

相反，FLOW-MATIC有两种用于控制流的选项。通常，代码是线性的，就像你期待的：从头开始，一直向下，一次执行一条语句。但是如果你执行了一条特殊语句比如`JUMP TO`，它就会改变控制流直接跳转到别的地方。比如，语句（13）跳转回语句（2）。

![](http://cdn.lsongzhi.cn/blog/flow-matic-2.svg)

就像我们最初的并发原语一样，对于如何称呼这种“单向跳转”有一些争议。在这里它是`JUMP TO`，但是约定俗成的名字是`goto`（就像‘go to’，懂吧？），所以我将用`goto`来称呼它。

下面是这个小程序里全部的`goto`跳转：

![](http://cdn.lsongzhi.cn/blog/flow-matic-4.svg)

如果你看着心累，你不是一个人！这种基于跳转的编程风格是FLOW-MATIC从汇编语言直接继承来的。它功能强大，非常符合计算机硬件的实际工作方式，但是就这么使用它让人非常困惑。为什么有“意大利面式代码”这种说法，就是因为这些错综复杂的箭头。显然，我们得来点更好的。

但是……是什么导致了这些问题？为什么有些控制结构不错，有的不好？我们怎么选择那些好的？当时，一切都还很不明朗，而且如果你不理解的话很难解决这个问题。

## 什么是`go`语句？

但让我们先停一下，每个人都知道`goto`不好。这跟并发有什么关系？额，想一下Go语言著名的`go`语句，它被用来派生一个新的”goroutine“（轻量级线程）：

```go
// Golang
go myfunc();
```

画个图？额，跟我们之前看到的都有所不同，因为控制流实际上真的分离了。我们可能会这样画：

![](http://cdn.lsongzhi.cn/blog/go-schematic-unlabeled.svg)

这里的颜色用来表示两条路径都被采用。从父goroutine（绿线）的角度来看，控制流线性执行：从头开始，然后立即出现在底部。与此同时，从子goroutine（紫线）的角度看，控制流从头开始，然后直接跳到`myfunc`函数。与常规函数调用不同，这种跳转是单向的：当运行`myfunc`时，我们切换到一个全新的栈，运行时会立即忘记我们从哪来。

但是这不仅仅适用于Golang。这就是我们这篇文章开头列出的*所有*原语的流程控制图：

* 线程库通常会提供一些类似`handle`对象的东西让你之后`join`该线程——但这是一个独立的操作，语言本身不会获取任何相关的信息。实际的线程派生原语具有以上的控制流。
* 注册回调在语义上等同于启动一个后台线程，该线程（a）阻塞直到某个事件发生，然后（b）运行回调。（尽管实现显然不同）所以就高级控制流而言，注册回调实际上是一个`go`语句。
* Future和Promise也是一样的：当你调用一个函数并返回一个`promise`时，意味着它将工作安排在后台进行，然后给你一个`handle`对象，以便稍后`join`（如果你想）。就控制流语义而言，这就像派生线程一样。然后在`promise`上注册回调，请参见前面的要点。

这种完全相同的模式以多种形式出现：关键的相似之处在于，在所有情况下，控制流都会分离，一边执行单项跳转，另一边返回到调用方。一旦你知道要找什么，你就会开始到处找——有趣的游戏！[^1]

不过令人恼火的是，这类控制流语句没有标准的名字。就像“`goto`语句”成为所有这些类`goto`语句的总称一样，我用“`go`语句”来称呼这类语句。为什么是`go`？一个原因是Golang给我们提供了一个特别纯粹的例子。另一个是……额，你可能已经猜到我想的了。看下面两张图，有什么相似之处？

![](http://cdn.lsongzhi.cn/blog/go-schematic-and-go-to-schematic.svg)

没错：`go`语句是`goto`语句的一种形式。

众所周知，并发程序难以编写和推断。基于`goto`的程序也是如此。仅仅是巧合吗？有没有可能是出于同样的原因？在现代语言中，`goto`引起的问题基本上已经得到了解决。如果我们研究它们是如何修复`goto`的，会不会能告诉我们如何写出更易用的并发API？让我们看看。

## `goto`怎么了？

所以为什么`goto`闯了这么多祸？在1960年代末， [Edsger W. Dijkstra](https://en.wikipedia.org/wiki/Edsger_W._Dijkstra)写了两篇现在很有名的论文，让这个问题更加明晰：[Go to statement considered harmful](https://scholar.google.com/scholar?cluster=15335993203437612903&hl=en&as_sdt=0,5),  [Notes on structured programming](https://www.cs.utexas.edu/~EWD/ewd02xx/EWD249.PDF) (PDF).

### `goto`：抽象破坏者

在这些论文中，Dijkstra担心的是如何编写有意义的软件并使其正确无误。我不能简单地加以评判，有太多迷人的见解了。例如，你可能看到过以下引用：

![](http://cdn.lsongzhi.cn/blog/20191219004221.png)

没错，这正是*Notes on structured programming*里的话。但是他主要关心的是抽象。他想写的程序太大了，你脑子里很难装得下。要做到这一点，你需要将程序的某些部分视为一个黑箱，就像你看下面的Python代码一样：

```python
print("Hello world!")
```

你无需知道所有的细节，比如`print`是怎么实现的（字符串格式化，缓冲，跨平台差异……）。只需知道它会以某种方式打印出你给它的文本，然后你就能把你的精力集中在思考你的代码上，这是不是就是你现在想要的。Dijkstra希望语言支持这种抽象。

至此，块语法被发明出来了，而且像ALGOL这样的语言已经积累了大约5种不同类型的控制结构：它们仍然有线性流和`goto`：

![](http://cdn.lsongzhi.cn/blog/sequential-and-go-to-schematic (1).svg)

还有了if/else、循环和函数调用：

![](http://cdn.lsongzhi.cn/blog/control-schematics.svg)

你可以用`goto`来实现更高级别的构造，早期人们就是这么看待它们的：方便的简写。但是Dijkstra指出，如果你观察这些图，`goto`与众不同。对于其余所有构造，流控制来到顶部→[事情发生]→流控制到达底部。我们可以称之为“黑箱规则”：如果一个控制结构具有此形状，在不关心内部细节时，可忽略[事情发生]部分，将整个程序视为常规的顺序流。更好的是，这也适用于由这些片段组成的任何代码。当我看到这段代码时：

```Python
print('Hello world!')
```

我不必去阅读`print`的定义和它所有的可传递依赖项来搞清楚控制流是怎么工作的。可能在`print`里面有一个循环，在循环中有一个`if/else`，在`if/else`中有另一个函数调用……或者是别的原因。这其实不重要：我知道控制流将流入`print`，该函数将执行它的操作，然后控制流最终将返回到我正在阅读的代码。

这似乎显而易见，但是如果你有一种带有`goto`的语言——一种函数和其他一切都建立在`goto`之上的语言，而且`goto`可以在任何时间跳转到任何地方——那么这些控制结构就根本不是黑箱。如果你有一个函数，函数里有一个循环，循环里面有一个`if/else`，`if/else`里面有一个`goto`……然后，`goto`可以将控制流跳转到任何它想去的地方。也许控制流会突然从另一个函数返回，一个你甚至还没有调用的函数。你什么都不会知道！

这打破了抽象：这意味*每一个函数调用都有可能是伪装的`goto`语句，唯一知道的方法是立即将系统的全部源代码保存在大脑中*。一旦`goto`在你的语言中出现，你就不能对流控制进行原地推断。这解释了*为什么*`goto`会产生意大利面式代码。

现在Dijkstra明白了这个问题，他可以解决。他的革命性建议是：我们应该停止把`if`/循环/函数调用看作是`goto`的简写，而应该将他们视为基本原语，而且我们应该将`goto`从我们的语言中完全删除。

在2018年的当下，这似乎已经足够明显了。但是你有没有看到过程序员在你以他们的愚笨会导致安全问题为由试图拿走他们的玩具时的反应？是的，大人，时代没变。1969年，这项提议引起了极大的争议。Donald Knuth为`goto`辩护。那些已经成为`goto`专家的人必须重新学习如何编程才能使用更新的、更有约束性的结构来表达他们的想法，而他们对此非常反感。当然，这需要一套全新的语言。

最后，现代语言对这一点的要求比Dijkstra最初的公式要低一些。它们将允许你使用`break`、`continue`或`return`等语句一次从多个嵌套结构中分离出来。但从根本上说，它们都是围绕Dijkstra的思想设计的；即使是这些突破边界的语句，也只能以严格限制的方式来使用。特别是函数——这是将控制流包装在黑盒中的基本工具——被认为是不可侵犯的。不能从一个函数`break`到另一个函数，`return`可以让你从当前函数中断，但到此为止。不管一个函数内部的控制流多么花里胡哨，其他函数都不必在意。

![](http://cdn.lsongzhi.cn/blog/wolf-and-bulldog.jpg)

<center>左：传统`goto`。右：驯化过的`goto`，见于C，C#，Golang等语言。<br>没法跨越函数边界意味着它仍然可以在你鞋子上撒尿，就是不能把你的脸撕破而已。</center>
这甚至延伸到`goto`本身。你会发现一些语言仍然有它们称之为`goto`的东西，比如C，C++，Golang……但是它们添加了严格的限制。起码，它们不会允许你从一个函数体跳转到另一个函数体。除非你在执行汇编代码[^2]，经典的不受限的`goto`已经没了。Dijkstra赢了。

### 意外收获：移除`goto`开启了新特性

一旦`goto`消失，有趣的事来了：语言设计者可以开始添加依赖于结构化控制流的特性。

例如，Python有个很好的资源清理语法：with语句。你可以写出这样的代码：

```python
# Python
with open("my-file") as file_handle:
    ...
```

它保证文件会在…代码中打开，随后立即关闭。大多数现代语言都有一些等价物（RAII，using，try-with-resource，defer，……）。他们都假设控制流有序，结构化。如果我们用`goto`来跳转到with块的中间……会发生什么？文件是否会打开？如果我们再次跳出而不是正常退出呢？文件会关闭吗？如果你的语言中有`goto`，这个特性就不能正常工作。

错误处理也有一个类似的问题：当出现错误时，代码应该怎么处理？通常的答案是将错误沿堆栈传给代码调用者，让他们去处理它。现代语言有专门的构造来简化这一过程，比如异常或者其他形式的[自动错误传播](https://doc.rust-lang.org/std/result/index.html#the-question-mark-operator-)。但你的语言只有在有一个堆栈和可称之为“调用者”的概念存在的情况下才能提供这种帮助。再看看我们的FLOW-MATIC程序中的意大利面式控制流，想象一下在代码当中引发一个异常。它会跳到哪？

### `goto`语句：一行也不要写

所以`goto`——忽略函数边界的传统类型——不仅是一般的很难正确使用的糟糕特性。如果是的话，它可能会幸存至今——就像许多坏特性一样。但它甚至更糟。

即使你自己不使用`goto`，在你的语言中仅把它作为一个选项，也会使一切都变糟。无论何时开始使用第三方库，都不能将其视为一个黑箱——必须通读所有函数，才能找出哪些函数是常规函数，哪些是伪装的特殊控制流构造。这严重阻碍了原地推断。而且，你将失去诸如可靠的资源清理和自动错误传播等强大的语言功能。最好完全删除`goto`，以支持遵循“黑箱”原则的控制流构造。

## 有害的`go`语句

`goto`的历史讲完了。现在，有多少能用在`go`语句上？额，基本上，全部！这个类比结果非常准确。

**go语句破坏了抽象**  还记得我们说过如果我们的语言允许`goto`，那么任何函数都有可能是伪装的`goto`吗？在大多数并发框架中，`go`语句会导致完全相同的问题：每当调用函数时，它可能会也可能不会生成一些后台任务。函数似乎返回了，但它是不是仍然在后台运行？如果不通读所有源代码，就没办法知道。什么时候结束？很难说。如果有`go`语句，那么函数就不再是控制流的黑箱。在我的[第一篇并发API文章](https://vorpus.org/blog/some-thoughts-on-asynchronous-api-design-in-a-post-asyncawait-world/)中，我称之为“破坏了因果律”，并发现这是使用了asyncio和Twisted的程序中许多常见的实际问题的根源所在，比如backpressure问题，正常关闭时出现的问题等等。

**go语句破坏了自动资源清理。** 让我们再回顾一下`with`语句的例子：

```Python
# Python
with open("my-file") as file_handle:
    ...
```

以前，我们说过我们“保证”文件在…代码中运行，然后关闭。但是如果…代码派生了一个后台任务呢？然后我们的保证就没了：看起来像在`with`块中的操作实际上可能会在`with`块结束后继续运行，然后崩溃，因为文件在它们仍在使用时被关闭。而且，你不能在原地将错误检查出来；要知道是否发生了这种情况，你必须通读所有在…代码中被调用的函数的源代码。

如果我们想让这段代码正常工作，我们需要以某种方式跟踪任何后台任务，并手动安排文件在完成后关闭。这是可行的——除非我们使用的库在任务完成时不提供任何获得通知的方法，这是令人不安的常见现象（例如，因为它没有暴露任何可以join的handle）。但即使在最好情况下，非结构化的控制流也意味着语言无法帮助我们。我们又得手工执行资源清理，一朝回到解放前。

**go语句破坏了错误处理。** 正如我们上面讨论的，现代语言提供了诸如异常之类的强大工具，以帮助我们确保错误被检测到并传播到正确的位置。但这些工具依赖于“当前代码的调用者”的可靠概念。一旦派生任务或者注册回调，这种概念就被破坏了。因此，我所知道的每一个主流并发框架都简单地放弃了。如果在后台任务中发生错误，并且你没有手动处理它，那么运行时只是……把它扔在地上，交叉手指，说它不太重要。如果你幸运的话，它可能会在控制台上打印一些东西（我使用过的唯一一个认为“打印并继续运行”是一个很好的错误处理策略的其他软件是糟糕的旧Fortran库，但我们已经到这了）甚至Rust——这门被高中班级选为最热衷于线程正确性的语言——也为此感到羞愧。如果后台线程panic，Rust将丢弃错误并希望获得最佳结果。

当然你可以在这些系统中正确地处理错误，方法是小心地确保join每个线程，或者构建自己的错误传播机制，比如[errbacks in Twisted](https://twistedmatrix.com/documents/current/core/howto/defer.html#visual-explanation)或者[Promise.catch in Javascript](https://hackernoon.com/promises-and-error-handling-4a11af37cb0e)。但是现在你在写一个自定义的，脆弱的，你的语言已经拥有的特性的重实现。你已经失去了一些有用的东西，比如“回溯”和“调试器”。只要有一次忘记了调用`Promise.catch`，然后就会突然间产生了巨大的错误，而你甚至都意识不到。即使你以某种方式解决了这些问题，你仍然得到两个冗余的做着同样事情的系统。

### `go`语句：一行也不要写

就像`goto`是第一种使用高级语言的明显原语一样，`go`也是第一种实用并发框架的明显原语：它与底层调度程序的实际工作方式相匹配，并且它足够强大，可以实现任何其他并发流模式。但同样像`goto`一样，它破坏了控制流抽象，因此在你的语言中仅仅将它作为一个可选项就使得所有东西都很难使用。

不过，好消息是，这些问题都可以解决：Dijkstra向我们展示了如何解决！我们需要：

* 找到一个具有类似能力但遵循“黑箱原则”的`go`语句的替代项。
* 将这个新构造作为原语构建到我们的并发框架中，并且不包含任何形式的`go`语句。

`Trio`就是这么干的。

## “nursery”：一个`go`语句的结构化替代项

核心思想是：每次我们的控件拆分成多个并发路径时，我们都希望确保它们再次连接起来。例如，如果我们想同时做三件事，我们的控制流应该是这样的：

![](http://cdn.lsongzhi.cn/blog/nursery-schematic-unlabeled.svg)

注意上面只有一个箭头，下面也有一个箭头，所以它遵循Dijkstra的黑箱原则。现在，我们怎样才能把这个草图变成一个具体的语言结构呢？有一些现成的结构可以满足这个约束，但是（a）我的建议与我所知道的所有的结构都有所不同，而且比它们更有优势（特别是在想要使它成为独立的原语的情况下），（b）并发文献庞大而复杂，试图把所有的历史和取舍分开会彻底打乱这场争论，所以我将其推迟到另一篇文章。在这里，我将集中精力解释我的解决方案。但请注意，我并不是声称自己发明了并发之类的概念，这篇文章从很多方面获取灵感，我站在巨人的肩膀上。[^3]

无论如何，我们要做的是：首先，我们声明一个父任务在它首先为子任务创建了一个居住的地方：nursery之前不能启动任何子任务。它通过打开一个nursery块来实现这一点，在Trio中，我们使用Python的`async with`语法来实现这一点：

![](http://cdn.lsongzhi.cn/blog/nursery-1-pathified.svg)

打开一个nursery块会自动创建一个表示此nursery的对象，并且`as nursery`语法将此对象分配给名为`nursery`的变量。然后我们可以使用nursery对象的`start_soon`方法来启动并发任务：在本例中，一个任务调用函数`myfunc`，另一个任务调用函数`anotherfunc`。从概念上讲，这些任务在nursery块内执行。实际上，将在nursery块中编写的代码看作是在创建块时自动启动的初始任务通常是很方便的。

![](http://cdn.lsongzhi.cn/blog/nursery-2-pathified.svg)

最重要的是，在所有的任务都退出之前，nursery块不会退出——如果在所有的子任务完成之前，父任务到达块的结束，那么它停在那里等待它们。nursery自动扩大以容纳孩子们。

下面是控制流：你可以看到它是如何与我们在本节开头显示的基本模式相匹配的：

![](http://cdn.lsongzhi.cn/blog/nursery-3-pathified.svg)

这种设计有许多后果，并非所有后果都显而易见。让我们仔细想想。

### “nursery”保全了函数抽象

`go`语句的基本问题是，当你调用一个函数时，你不知道它是否会派生一些后台任务，这些任务在完成后仍在运行。使用“nursery”，你就不必担心这个问题：任何函数都可以打开一个nursery并运行多个并发任务，但在它们全部完成之前，函数不能返回。所以当一个函数真的返回时，你就知道它真的完成了。

### “nursery”支持动态任务派生

这里有一个更简单的原语，也可以满足上面的流程控制图。它获取一个函数的列表然后并发地执行它们。

```Python
run_concurrently([myfunc, anotherfunc])
```

但问题是你必须事先知道你要运行的任务的完整列表，并不总是能够如此。例如，服务器程序通常有`accept`循环，接受传入的连接并启动一个新任务来处理每个连接。以下是Trio中最小的`accept`循环：

```Python
async with trio.open_nursery() as nursery:
    while True:
        incoming_connection = await server_socket.accept()
        nursery.start_soon(connection_handler, incoming_connection)
```

对于“nursery”来说，这很简单，但是用`run_concurrently`来实现将非常困难。如果你想的话，很容易就可以在“nursery”的基础上实现`run_concurrently`，但是实际上没必要。因为`run_concurrently`可以处理的简单情况，“nursery”同样也可以处理，还更易读。

### 有一个出口

“nursery”对象还为我们提供了一个逃生舱口。如果你真的需要编写一个函数来生成一个后台任务，而后台任务比函数本身还长，该怎么办？简单：向函数传递一个nursery对象。没有规则规定只有直接位于`async with open_nursery()`块内部的代码才能调用`nursery.start_soon`——只要该“nursery”块保持打开状态[^4]，那么任何获取对该“nursery”对象的引用的人都可以获得将任务生成到该nursery的能力。你可以将其作为函数参数传入，或通过队列发送。

实际上，这意味着你可以编写“违反规则”的函数，但是得在一定限制范围内：

* 由于必须显式地传递"nursery"对象，你可以通过查看它们的调用位置立即确定哪些函数违反了正常的流控制。因此仍然可以进行原地推理。
* 函数生成的任何任务仍受传入的“nursery”生存期的约束。
* 调用的代码只能传入它自己可以访问的“nursery”对象。

因此，这与那种任何代码都可以在任何时刻派生具有无限生存期的后台任务的传统模型有很大不同。

有一点很有用，那就是证明“nursery”有着和`go`语句一样的表达力，但是这篇文章已经够长了，所以我改天再说。

### 你可以定义跟“nursery”一样“嘎嘎叫”的新类型

标准的“nursery”语义提供了坚实的基础，但有时你想要不同的东西。也许你羡慕Erlang还有它的supervisors，并希望定义一个类似于“nursery”的类，该类通过重新启动子任务来处理异常。（译者注：有一个典型的例子，[Bastion](https://bastion.rs/)，一个从Erlang中汲取了灵感用Rust编写的高可用分布式容错运行时）这是完全可能的，对你的用户来说，它看起来就像一个普通的“nursery”：

```Python
async with my_supervisor_library.open_supervisor() as nursery_alike:
    nursery_alike.start_soon(...)
```

如果有一个函数以一个“nursery”为参数，则可以传递其中一个参数来控制它派生的任务的错误处理策略。很漂亮。但是，这里有一个微妙之处，将Trio推向了不同于asyncio或其他一些库的不同约定：这意味着`start_soon`必须获取一个函数，而不是协程对象或者一个`Future`。（你可以多次调用函数，但是无法重启一个协程对象或者`Future`。）我认为这是更好的约定，不管怎么说，有很多原因（特别是因为Trio甚至没有`Future`！），但是仍然值得一提。

### 真的，“nursery”*总是*等着其中的任务退出

另一件值得讨论的事情是，任务取消和任务join是如何相互作用的，这里有一些微妙之处，如果处理不当，可能会破坏nursery不变量。

在Trio中，代码可以随时接受取消请求。请求取消后，下次代码执行“检查点”操作([详细信息](https://trio.readthedocs.io/en/latest/reference-core.html#checkpoints))时，将引发取消的异常。这意味着，请求取消和实际发生取消之间存在差距——任务执行检查点之前可能需要一段时间，之后一场必须解除堆栈、运行清理处理程序等。发生这种情况时，nursery总是等到完全清理完毕。我们从不在不给任务运行清理处理程序的机会的情况下终止任务，也从不让任务脱离nursery的监管，即使它正在被取消。

### 自动资源清理

因为nursery遵循黑箱原则，`with`块又能派上用场。比方说，在`with`块的末尾关闭一个文件不会意外中断仍在使用该文件的后台任务。

### 自动错误传播

如上所述，在大多数并发系统中，后台任务中未处理的错误只是被丢弃。然后就实在没什么事情可以做了。

在Trio中，由于每个任务都位于nursery内，并且每个nursery都是父任务的一部分，因此父任务需要等待nursery内的任务……我们确实可以处理未处理的错误。如果后台任务因异常而终止，我们可以在父任务中重新运行它。这里的直觉是，nursery类似于“并发调用”原语：我们可以将上面的示例看作同时调用`myfunc`和`anotherfunc`，因此我们的调用堆栈已成为一棵树。异常向上传播这个调用树到根，就像它们向上传播一个常规调用堆栈一样。

不过，在此有一个微妙之处：当我们在父任务中引发异常时，它将开始在父任务中传播。一般来说，这意味着父任务将退出nursery块。但是我们已经说过，当仍有子任务在运行时，父任务不能离开nursery块。那我们该怎么办？

答案是，当一个未处理的异常发生在一个子任务身上时，Trio会立即取消同一个nursery中的所有其他任务，然后等待它们完成，然后再重新引发异常。这里的直觉是，异常会导致堆栈展开，如果我们想展开堆栈树中的某个分支点，则需要通过取消这些分支来展开其他分支。

这确实意味着如果你想用你的语言实现nursery，你可能需要在nursery代码和你的取消系统中进行某种集成。如果您使用的是像C#或Go这样的语言，其中通常通过手动对象传递和约定来管理取消，或者（更糟的是）没有通用取消机制的语言，那么这可能会很棘手。

### 意外之喜：移除`go`语句开启新的特性

消除`goto`允许以前的语言设计人员对程序的结构作出更有力的假设，从而启用了新的功能：如块和异常；消除`go`语句也有类似的效果。例如：

* Trio的取消机制比竞争对手更易用，也更可靠，因为它可以假设任务嵌套在一个规则的树结构中，有关完整的讨论，请参考[Timeouts and cancellation for humans](https://vorpus.org/blog/timeouts-and-cancellation-for-humans/) 。
* Trio是唯一一个其中control-C的工作方式与Python开发者期望的（细节）相同的并发库。如果没有nursery提供传播异常的可靠机制，这是不可能的。

## 实践中的nursery

上面的全是理论，实践中怎么样？

额……这是一个经验性问题：你应该试试看，然后找出答案！但说真的，得很多人用过它之后我们才能知道。在这一点上，我很有信心，基础很牢靠，但也许我们会意识到我们需要调整一下，比如早期结构化编程倡导者最终停止摆脱`break`和`continue`。

如果你是一个有经验的并发程序员，正在学习Trio，那么你应该会发现它有时会有点不稳定。你将不得不[学习新的做事方法](https://stackoverflow.com/questions/48282841/in-trio-how-can-i-have-a-background-task-that-lives-as-long-as-my-object-does)——就像70年代的程序员发现在没`goto`的情况下学习如何编写代码很有挑战性一样。

当然，这就是重点。正如Knuth所写，([Knuth, 1974](https://scholar.google.com/scholar?cluster=17147143327681396418&hl=en&as_sdt=0,5), p. 275):

> *Probably the worst mistake any one can make with respect to the subject of* **go to** *statements is to assume that "structured programming" is achieved by writing programs as we always have and then eliminating the* **go to**'s. Most* **go to**'s shouldn't be there in the first place! What we really want is to conceive of our program in such a way that we rarely even* *think* *about* **go to** *statements, because the real need for them hardly ever arises. The language in which we express our ideas has a strong influence on our thought processes. Therefore, Dijkstra asks for more new language features – structures which encourage clear thinking – in order to avoid the* **go to**'s temptations towards complications.*

到此为止，这是我使用nursery的经验：它们鼓励清晰的思考。它们带来了更健壮、更易于使用和更全面的设计。这些限制实际上使解决问题变得更容易，因为你花在不必要的复杂问题上的时间更少。从一个非常真实的意义上说，使用Trio教会了我成为一个更好的程序员。

例如，考虑Happy eybells算法 ([RFC 8305](https://tools.ietf.org/html/rfc8305))，这是一个简单的并发算法，用于加快TCP连接的建立。从概念上讲，这个算法并不复杂——你可以相互竞争多个连接尝试，交错开始以避免网络过载。但如果你看看[Twisted的最佳实现](https://github.com/twisted/twisted/compare/trunk...glyph:statemachine-hostnameendpoint)，他差不多有600行代码，而且至少还有[一个逻辑错误](https://twistedmatrix.com/trac/ticket/9345)。Trio中的等效实现至多是其十五分之一。更重要的是，使用Trio，我可以在几分钟内而不是几个月内写出它，而且我在第一次尝试时逻辑就正确了。我不可能在任何其他框架中做到这一点，即使是那些我有更多经验的框架。你可以看我[上个月在Pyninsula的演讲](https://www.youtube.com/watch?v=i-R704I8ySE)以了解更多细节。这是典型的吗？时间会证明一切，但这肯定很有希望。

## 结论

流行的并发原语——`go`语句，线程派生函数、回调、`Future`，`Promise`……在理论和实践上它们都`goto`的变体。甚至不是现代的驯化`goto`，而是老式的火烧石的`goto`,可以跨越函数边界。即使我们不直接使用它们，这些原语也是危险的，因为它们破坏了我们对控制流的推理能力，破坏了从抽象的模块部分中构造出复杂系统的能力，而且它们干扰了有用的语言特性，比如自动资源清理和错误传播。因此，像`goto`一样，它们在现代高级语言中没有立足之地。

Nursery提供了一个安全而方便的替代方案，它保留了语言的全部功能，并实现了强大的新功能（正如Trio的作用域级别任务取消和Ctrl-C处理所证明的那样），并且可以在可读性、效率和正确性方面有显著的提高。

不幸的是，为了完全拥有这些好处，我们确实需要完全删除的旧的原语，这可能需要从头开始构建新的并发框架——就像消除`goto`需要设计新的语言一样。但是，尽管FLOW-MATIC在当时给人留下了深刻的印象，但我们大多数人对升级到更好的东西都乐见其成。我想我们也不会后悔改用nursery，Trio证明了这是一种实用的、通用的并发框架的可行设计。

## 鸣谢

非常感谢Graydon Hoare、Quentin Pradet和Hynek Schlawack对这篇文章的草稿提出的意见。当然，剩下的任何错误都是我的错。

FLOW-MATIC样本代码来自于[本手册](http://archive.computerhistory.org/resources/text/Remington_Rand/Univac.Flowmatic.1957.102646140.pdf)（PDF），由[计算机历史博物馆](http://www.computerhistory.org/collections/catalog/102646140)保存。[Wolves in Action](https://www.flickr.com/photos/iam_photo/478178221)，作者：i:am. photography / Martin Pannier, 以 [CC-BY-SA 2.0](https://creativecommons.org/licenses/by-nc-sa/2.0/)协议发布, 有所裁剪. [French Bulldog Pet Dog](https://pixabay.com/en/french-bulldog-pet-dog-funny-2427629/) by Daniel Borker, 以[CC0 public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/)协议发布 .

## 脚注

[^1]:至少对某一类人来说是这样的.
[^2]:而WebAssembly甚至证明了没有 "goto "的低级汇编语言是可能的，至少在某种程度上是可取的: [reference](https://www.w3.org/TR/wasm-core-1/#control-instructions①), [rationale](https://github.com/WebAssembly/design/blob/master/Rationale.md#control-flow)
[^3]:对于那些在不知道我是否知道他们最喜欢的论文的情况下，不会关注这篇文章的人，我目前已经阅读过的主题包括: the "parallel composition" operator in Cooperating/Communicating Sequential Processes and Occam, the fork/join model, Erlang supervisors, Martin Sústrik's article on [Structured concurrency](http://250bpm.com/blog:71) and work on [libdill](https://github.com/sustrik/libdill), and [crossbeam::scope](https://docs.rs/crossbeam/0.3.2/crossbeam/struct.Scope.html) / [rayon::scope](https://docs.rs/rayon/1.0.1/rayon/fn.scope.html) in Rust. [Edit: I've also been pointed to the highly relevant [golang.org/x/sync/errgroup](https://godoc.org/golang.org/x/sync/errgroup) and [github.com/oklog/run](https://godoc.org/github.com/oklog/run) in Golang.] If I'm missing anything important, [let me know](mailto:njs@pobox.com).
[^4]:如果你在nursery块退出后调用 `start_soon`，那么`start_soon`会产生一个错误，反之，如果它没有产生错误，那么nursery块将被保证保持开放，直到任务结束。如果你正在实现你自己的nursery系统，那么你会希望在这里小心地处理同步。

