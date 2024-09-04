# Ton Contract Tutorial
## 基础钱包
### 钱包V1
这是最简单的一个。它只允许您一次发送一笔交易，除了您的签名和序列号(`seqno`)，它不检查任何东西。
这个版本甚至没有在常规应用中使用，因为它存在一些主要问题：
* 无法从合约中轻松检索序列号和公钥
* 没有`valid_until`检查，所以您不能确定交易不会太晚被确认。

第一个问题在V1R2和V1R3中得到修复。R字母代表修订版本。通常修订版本只是添加`get`方法，允许您从合约中检索序列号和公钥。 但这个版本还有第二个问题，这个问题在下一个版本中得到修复。

### 钱包V2
这个版本引入了`valid_until`参数，用于设置交易的时间限制，以防您不希望交易太晚被确认。
这个版本也没有公钥的get方法，它在V2R2中被添加。
### 钱包V3
这个版本引入了`subwallet_id`参数，允许您使用同一个公钥创建多个钱包（所以您可以只有一个种子短语和很多钱包）。和以前一样，V3R2只添加了公钥的get方法。
基本上，`subwallet_id`只是在部署时添加到合约状态的一个数字。由于TON中的合约地址是其状态和代码的哈希，所以不同的`subwallet_id`将会改变钱包地址。
### 钱包V4
它是目前最现代的钱包版本。它仍然具有之前版本的所有功能，但还引入了一些非常强大的东西——插件。
这个功能允许开发者实现与用户钱包并行工作的复杂逻辑。例如，某些DApp可能需要用户每天支付少量币以使用某些功能，因此用户需要通过签署交易在其钱包上安装插件。
这个插件将在每天接收外部消息时向目的地址发送币。

## 消息
### CommonMsgInfoRelaxed
#### int_msg_info

| 字段          | 类型                 | 大小（位） | 说明                  |
|-------------|--------------------|-------|---------------------|
| 0           | Bool               | 1     | 0开始                 |
| ihr_disable | Bool               | 1     | 是否禁用即时超立方路由（目前始终为真） |
| bounce      | Bool               | 1     | 是否在处理过程中出错时弹回消息     |
| bounced     | Bool               | 1     | 消息本身是否是弹回的结果        |
| src         | MsgAddress         | 2     | 源地址                 |
| dest        | MsgAddress         | 256   | 目的地址                |
| value       | CurrencyCollection |       | 消息值                 |
| ihr_fee     | Grams              | 4     |                     |
| fwd_fee     | Grams              | 4     |                     |
| create_lt   | uint64             | 64    |                     |
| create_at   | uint32             | 32    |                     |
| init        | Bool               | 1     | 没有init字段            |
| either      | Bool               | 1     | 消息体将就地序列化           |

如果消息是从智能合约发送的，其中一些字段将被重写为正确的值。特别是，验证者将重写`bounced`、`src`、`ihr_fee`、`fwd_fee`、`created_lt`和`created_at`。
这意味着两件事：
* 首先，另一个智能合约在处理消息时可以信任这些字段（发送者无法伪造来源地址、bounced标志位等）；
* 其次，在序列化时我们可以将任何有效值放入这些字段中（无论如何这些值都将被重写）。

消息的直接序列化如下所示：
```
  var msg = begin_cell()
    .store_uint(0, 1)             ;; tag
    .store_uint(1, 1)             ;; ihr_disabled
    .store_uint(1, 1)             ;; allow bounces
    .store_uint(0, 1)             ;; not bounced itself
    .store_slice(source)          ;; from addr
    .store_slice(destination)     ;; to addr
    .store_coins(amount)          ;; value
    .store_dict(extra_currencies) ;; extra value
    .store_coins(0)               ;; ihr_fee
    .store_coins(fwd_value)       ;; fwd_fee 
    .store_uint(cur_lt(), 64)     ;; lt of transaction
    .store_uint(now(), 32)        ;; unix time of transaction
    .store_uint(0, 1)             ;; no init-field flag (Maybe)
    .store_uint(0, 1)             ;; inplace message body flag (Either)
    
    .store_slice(msg_body)
  .end_cell();
```

使用快捷方式：
```
 var msg = begin_cell()
    .store_uint(0x18, 6)        ;; tag(0) + ihr_disabled(1) + bounce(1) + bounced(0) + source(00)
    .store_slice(addr)          ;; destination
    .store_coins(grams)         ;; amount
    .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1) 
    
    .store_uint(ans_tag, 32)    ;; msg body
    .store_uint(query_id, 64);
```
首先，它将`0x18`值放入6位，即放入`0b011000`。
* 第一位是`0` — 1位前缀，表示它是`int_msg_info`。
* 然后有3位`1`、`1`和`0`，表示即时超立方路由被禁用，消息可以在处理过程中出错时回弹，消息本身不是回弹的结果。
* 然后应该是发送者地址，但由于它无论如何都会被重写，因此可以存储任何有效地址。最短的有效地址序列化是addr_none的序列化，它序列化为两位字符串`00`。

长度等于`1 + 4 + 4 + 64 + 32 + 1 + 1`的零字符串。
* 第一个位表示空的extra-currencies字典。
* 然后我们有两个长度为4位的字段。它们以VarUInteger 16编码为0。事实上，由于ihr_fee和fwd_fee将被重写，我们同样可以在那里放置零。
* 然后我们将零放入created_lt和created_at字段。这些字段也将被重写；然而，与费用不同，这些字段有固定长度，因此被编码为64位和32位长的字符串。
（我们已经序列化了消息头并传递到init/body）
* 接下来的零位表示没有init字段。
* 最后一个零位表示消息体将就地序列化。










