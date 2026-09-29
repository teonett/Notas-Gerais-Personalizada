# C# - BFF Opção para não utilização de IF 

*** BFF Opção para não utilização de IF ***

		try
        {
			ValidarRetornoGerarRegistroAporte(dadosRegistroAporte);
		}
		catch (ErroNegocialException excecaoNegocial)
		{
			return new(false, mensagemHelper.ObterMensagemErroNegocial(excecaoNegocial.CodigoErro, excecaoNegocial.Message));
		}
		catch (Exception exc)
		{
			logWrapper.LogError(msgError, exc);
			return new(false, mensagemHelper.ObterMensagemErroGenerico(1, msgError));
		}

        private static void ValidarRetornoGerarRegistroAporte(DomainAporte.RetornoRegistroAporte retornoRegistroAporte)
        {
            if (string.IsNullOrWhiteSpace(retornoRegistroAporte?.MsgErroExcessao))
                return;

            if (retornoRegistroAporte.MsgErroExcessao.Contains(DomainAporte.CodigosErroAporte.LimiteDataAntecedenciaRegistroAporte))
                throw new ErroNegocialException("A data de aporte necessita respeitar o limite de antecedencia.", 2);

            throw new ErroNegocialException("Ocorreu um erro ao Registrar o Aporte.", 3);
        }

---

# Portal Economiario - Tipo conta operação Caixa

Quais são todas operações disponíveis na Caixa Econômica Federal?
Segue a Lista completa de códigos de operação da Caixa:

001 – Conta Corrente de Pessoa Física
002 – Conta Simples de Pessoa Física
003 – Conta Corrente de Pessoa Jurídica
006 – Entidades Públicas
007 – Depósitos Instituições Financeiras
013 – Poupança de Pessoa Física
022 – Poupança de Pessoa Jurídica
023 – Conta Caixa Fácil
028 – Poupança de Crédito Imobiliário
032 – Conta Investimento Pessoa Física
032 – Conta Investimento Pessoa Física
034 – Conta Investimento Pessoa Jurídica
037 – Conta Salário
043 – Depósitos Lotéricos
131 – Poupança Integrada
=====================================================================================
=====================================================================================
Tipo de conta bancária
- NSGD => Maior que 11 digitos
- SIDEC => Até 11 digitos

---

# Padrão de instalação FullStack (Portal Economiário)

Padrão de instalação FullStack (Portal Economiário)

* GIT
-> https://azuredevops.caixavidaeprevidencia.intranet/CVP/CVP.Frontends/_wiki/wikis/CVP.FrontEnds.wiki/26/Configurar-o-SSL-no-Git
-> https://azuredevops.caixavidaeprevidencia.intranet/CVP/CVP.Frontends/_wiki/wikis/CVP.FrontEnds.wiki/27/Ignorar-o-SSL-no-Git

* Chrome

* Visual Studio (2022/2026) versão Professional
-> MS Sql Server Express/LocalDB
-> https://azuredevops.caixavidaeprevidencia.intranet/CVP/CVP.Frontends/_wiki/wikis/CVP.FrontEnds.wiki/12/Utilizar-o-Artifacts-com-NUGET


* SDK .Net Core 8.x
* SDK .Net Core 10.x

* Visual Studio Code
-> Extensões
---> EditorConfig for VS Code
---> Prettier - Code formatter
-> incluir no settings.json (CTRL+SHIFsecretT+P)
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnPaste": true,
  "editor.formatOnType": true,
}

* MS Management Studio
Node/NPM 
-> https://azuredevops.caixavidaeprevidencia.intranet/CVP/CVP.Frontends/_wiki/wikis/CVP.FrontEnds.wiki/11/Utilizar-o-Artifacts-com-NPM

* Notepad ++
* Postman

--------------------------------------------

Use the instructions bellow to fix wget problem

npm config set strict-ssl false
or
yarn config set "strict-ssl" false

wget https://registry.npmjs.org/coffee-script --ca-certificate=./DigiCertHighAssuranceEVRootCA.crt 
or
you can download root certificate from : 
https://www.digicert.com/CACerts/DigiCertHighAssuranceEVRootCA.crt

--------------------------------------------

* Erro quando da erro de environment ao rodar o projeto (Babel / WebPack)
Webpack build failing with ERR_OSSL_EVP_UNSUPPORTED
https://stackoverflow.com/questions/69394632/webpack-build-failing-with-err-ossl-evp-unsupported

I was able to fix it via:
Linux 
export NODE_OPTIONS=--openssl-legacy-provider

Windows
$env:NODE_OPTIONS="--openssl-legacy-provider"

---

# Excel - Gerar Guid

*** Gerar GUID no Excel [Formula] *** 
https://www.tomasvasquez.com.br/blog/microsoft-office/excel/excel-gerando-guids-sem-vba/
=CONCATENAR(DECAHEX(ALEATÓRIOENTRE(0;4294967295);8);"-";DECAHEX(ALEATÓRIOENTRE(0;42949);4);"-";DECAHEX(ALEATÓRIOENTRE(0;42949);4);"-";DECAHEX(ALEATÓRIOENTRE(0;42949);4);"-";DECAHEX(ALEATÓRIOENTRE(0;4294967295);8);DECAHEX(ALEATÓRIOENTRE(0;42949);4))

---

# SQL - Busca Information Schema

select * from INFORMATION_SCHEMA.COLUMNS 
where IS_NULLABLE = 'NO'
and DATA_TYPE not in ('bigint', 'bit', 'datetime', 'datetime2', 'datetimeoffset', 'decimal', 'int', 'real', 'smallint', 'tinyint')
and CHARACTER_MAXIMUM_LENGTH > 10
=============================================================================
-- NOME DA TABELA PROCURANDO ATRAVES DO NOME DA COLUNA
=============================================================================
SELECT 
    '[' + s.name + '].[' + o.name + ']' AS objeto,
    c.name                               AS coluna,
    o.type_desc                          AS tipo
FROM 
    sys.objects o
INNER JOIN 
    sys.columns c ON o.object_id = c.object_idftrus
INNER JOIN
    sys.schemas s ON o.schema_id = s.schema_id
WHERE 
    c.name LIKE '%agencia%'
    AND o.type IN ('U', 'V') -- U = Table, V = View
ORDER BY 
    s.name, o.name, c.column_id;

---

# Portal Economiario - Log - Application Insights - Erro 401 - validar conta

Log - Application Insights - Erro 401 - validar conta

union decryptedTraces, exceptions
| where message has "contaBancaria/validacaoConta"
// | where operation_Id has "d805ad8986dccaf8a9929a96cc552974"
| order by timestamp desc
| project decryptedData, customDimensions, message


union decryptedTraces, exceptions
| where message has "contaBancaria/validacaoConta"
// | where message has "/api/corporativo/banco/recuperarBancos"
// | where message has"/lgpd/consentimento/consultar"
// | where operation_Id has "3dfe4eefb1c7853876aaeb39f733ca4e"
// | extend DadoDecriptado = base64_decode_tostring(customMeasurements['data'])
| order by timestamp desc

---

# GIT - Commits Pattern

git commit -m "test: add test for create product automation" 
git commit -m "feat: implement tracking product service" 
git commit -m "refactor: change return log pattern" 
git commit -m "style: change function param for objects" 
git commit -m "fix: remove getPayment() wrong attribute" 
git commit -m "chore: add no-undef rule in eslintrc.json", 
git commit -m "docs: add technologies list in readme" 
git commit -m "style: remove all blank spaces" 
git commit -m "perf: change looping for parallel execution" 
git commit -m "build: remove moment.js dependency" 
git commit -m "build: add date-fns npm dependency" 
git commit -m "revert: back to a215868 commit"

------------------------------------------------
git clone -c core.longpaths=true
------------------------------------------------
git show --pretty="" --name-only commit_code(parcial ou inteiro)

git show --pretty="" --
name-only 8528825f1ea354910a6394914d3840738787d1a5

undo 
- git reset --soft HEAD~1

undo hard 
- git reset --hard HEAD~1

undo mixed 
- git reset --mixed HEAD~1

log 
- git log --oneline

log graph 
- git log --oneline --graph

remove local branch - git branch -D Branch_Name

git reset soft 
-  git reset --soft HEAD~2

git log --pretty=oneline --abbrev-commit

recuperar a branch a partir do id do commit 
- git branch --contains 2ff00c44
or
- git branch -a --contains 796c5e2d7cacbab5a368c8151ea9f3e000acb3b6

log a partir de uma branch especifica 
-  git log --graph --decorate --oneline --all ^Nome-Branch^!

git log -p

git show commit_value => git show 726ddbdf

* remove all untracked files, including ignored files
git clean -f -x instead
---- git clean -f -x (remove all untracked files, including ignored files)
---- Esse comando apaga arquivos não versionados + arquivos listados no .gitignore (builds, logs, .env, node_modules, arquivos de IDE, chaves temporárias, etc.).

git reflog expire --all --expire=now
---- git reflog expire --all --expire=now + git prune --prune-empty --all
Esses comandos matam o reflog inteiro imediatamente (perde-se a capacidade de recuperar commits “perdidos” via git reset, git rebase --abort, git commit --amend malfeito, etc.) e removem commits/árvores vazios.

git -prune-empty -- --all

git filter-branch --index-filter 'git rm --cached --ignore-unmatch Filename' --prune-empty -- --all
---- Esse comando reescreve todo o histórico do repositório para remover um arquivo de todos os commits. Não use em (quase nunca mais em 2025/2026)

* guaranteed to remove all your git garbage
git -c gc.reflogExpire=0 -c gc.reflogExpireUnreachable=0 \
  -c gc.rerereresolved=0 -c gc.rerereunresolved=0 \
  -c gc.pruneExpire=now gc "$@"

---

# Validação C#  - Regex

Validação C# 

[RegularExpression(@"\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b")]
Regex emailRegex = new Regex(@"^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}");
Regex regex = new Regex(@"^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$");

Retornar apenas numeros

new Regex(@"^-?[0-9][0-9,\.]+$")

var RemoveNaoNumericos = Regex.Replace(Input, @"[^0-9]", string.Empty)

function validaemail(email) {
        var objRegExp = /^[A-Za-z]([\w\.]*)@([A-Za-z0-9\.]*)\.(([A-Za-z]{3}\.[A-Za-z]{2}$)|([A-Za-z]{3}$)|([a-z]{2}$))/i;
        return objRegExp.test(email);
    }

-------------------------------

Real Number Regex 
Pattern.compile("^(?:-(?:[1-9](?:\\d{0,2}(?:,\\d{3})+|\\d*))|(?:0|(?:[1-9](?:\\d{0,2}(?:,\\d{3})+|\\d*))))(?:.\\d+|)$")

    public static void Main()
    {
        // Validate number
        Regex validateNumberRegex = new Regex("^\\d+$");
        Console.WriteLine(validateNumberRegex.IsMatch("42"));  // prints True
        
        // Extract number from a string
        Regex extractNumberrRegex = new Regex("\\d+");
        string [] extracted = extractNumberrRegex.Matches("Your message was viewed 203 times.")
            .Cast<Match>()
            .Select(m => m.Value) 
            .ToArray(); 
        Console.WriteLine(String.Join(",", extracted)); // prints 203

------------------------------------------------

	private void btnValidate_Click(object sender, EventArgs e)
	{
		Regex regex = new Regex(@"^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$");
		bool isValid = regex.IsMatch(txtEmail.Text.Trim());
		if (!isValid)
		{
			MessageBox.Show("Invalid Email.");
		}
	}

* REGEX Caracteres especiais
function mtel(v){
    v=v.replace(/D/g,"");             //Remove tudo o que não é dígito
    v=v.replace(/^(d{2})(d)/g,"($1) $2"); //Coloca parênteses em volta dos dois primeiros dígitos
    v=v.replace(/(d)(d{4})$/,"$1-$2");    //Coloca hífen entre o quarto e o quinto dígitos
    return v;
}

---

# SQL - Local - String de Conexão

"DefaultConnection": "Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=PEDB00;Integrated Security=True"

Data Source=(localdb)\MSSQLLocalDB;Initial Catalog=PEDB00;Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=False;ApplicationIntent=ReadWrite;MultiSubnetFailover=False

"DefaultConnection": "Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=PEDB00;Integrated Security=True"

---

# Portabilidade de Retenção - SQL Server

Portabilidade de Retenção - SQL Server

use PEDB00
select * from (
SELECT [NUM_AGENCIA_ORIGEM], count(1) qtd
  FROM [PEDB00].[RET].[PE_016_RETENCAO_PORTABILIDADE] with (nolock)
  group by [NUM_AGENCIA_ORIGEM]) x
 where x.qtd >= 5

---

# Passwrod Reset

Passwrod Reset
https://passwordreset.microsoftonline.com/?whr=caixavidaeprevidencia.com.br

---

# Formação - Uteis

Exemplo Javascript - https://www.w3schools.com/howto/howto_css_timeline.asp

*** FREE CERTIFICATIONS **
https://preettheman.medium.com/best-free-certifications-for-software-engineers-f525f8d6a4d3

---

# Teo - Codeium Token

Codeium Token
eyJhbGciOiJSUzI1NiIsImtpZCI6IjZjYzNmY2I2NDAzMjc2MGVlYjljMjZmNzdkNDA3YTY5NGM1MmIwZTMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVGVvIE5ldG8iLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZXhhMi1mYjE3MCIsImF1ZCI6ImV4YTItZmIxNzAiLCJhdXRoX3RpbWUiOjE3MjczNDU5MDMsInVzZXJfaWQiOiJBU2V2UEQwckcyVkUyQ2JqRGF2SkZDd2htTHIxIiwic3ViIjoiQVNldlBEMHJHMlZFMkNiakRhdkpGQ3dobUxyMSIsImlhdCI6MTcyNzM0NTk0NCwiZXhwIjoxNzI3MzQ5NTQ0LCJlbWFpbCI6InRlby5uZXR0QGhvdG1haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInRlby5uZXR0QGhvdG1haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.aSOTSLa9iqzkMpwftRUQbvFqTOmYuXXfvidM57bdfJRDdl5KTg-zm7wW2mad_2CmHehY8FYt9VxXg8qRZzzk3fmAtd3w2b00LYFJ0yBjwY2J7-z55Z6iMUJlMpGgUcwg-VpleLs6UT35lWKOQFY39CazLaV51VbgYBdaSDiBZEj_b5YwmR1aYHlx1fv7DWgBUuvpu9MmnAtU5S9BFAsAcX3KtgCss2VKH23q-N1fNyoqCVF-VZ_98SrbDwPeljbCOJmkxfQE8luP8wdENuactpA4McRx2gUeIC1iHmMkSumhxCD_YDg0ndn_kfFqoeERCXoGy51mXImxzcsW7Ev6gQ

---

# Teo - Squidex

https://squidex.kallesoft.com.br/
Mudar@123456
 
https://teonett.kallesoft.com.br/

---

# Portal Economiario - Regras de atuação no Projeto

Regras de atuação no Projeto

** US Testes Unitários de Back **
-> Criar o teste unitário a partir da Controller
-> Ao final executar o Teste Unitário de todos os existentes para validar que não há nenhum quebrado
-> Remover referencias não utilizadas
-> Efetuar refactoring no código deixando o "Code Metric" com index >= 70 ou o mais próximo possível
-> Adicionar print na US dos testes realizados (Test Explorer)
-> Incluir na US horas gastas com a atividade.


Nosso projeto tanto back quanto front estão divididos atualmente em 2 frentes
- Migração (branch dev-migracao-pe) - módulos que estão sendo evoluídos de um sistema legado e que irão passar pelo processo de homologação, e somente depois disso serão promovidos a produção 
- Evolução (branch release) - módulos que já estão em produção e ja sendo utilizados pelos economiários no balcão das agências da Caixa.

INT-CVP-US0000
 |   |    |-> Numero da Atividade
 |   |-> Nome abrevidado do time que esta executando a atividade
 |-> Indicação se o desenvolvimento esta sendo feito pelo time interno(INT) o externo(EXT)

BFF
* A estrutura de pastas em todo o projeto é totalmente idêntica em todos os níveis, desde a main (pública pra todo o projeto) até as features.

---

# HTML - Markdown

HTML Markdown - Azure Devops - Wiki

# Portal Economiário (Antigo/Atual)
| **Ambiente** | **Endereço** |
|--------------|:----------------------------:|
| PRD | https://portaleconomiario.caixaseguradora.com.br/PortalEconomiario/economiario/principal/tela_entrada.asp |
| HML | https://portaleconomiariohm.caixaseguradora.com.br/PortalEconomiario/economiario/principal/tela_entrada.asp |
| DEV | https://portaleconomiariodev.caixaseguradora.com.br/PortalEconomiario/economiario/principal/tela_entrada.asp |
-------------------------------


Exemplo 
| Heading 1 | Heading 2 | Heading 3 |  
|-----------|:-----------:|-----------:|  
| Cell A1 | Cell A2 | Cell A3 |  
| Cell B1 | Cell B2 | Cell B3<br/>second line of text |  


Nested lists
Example:


Copy
1. First item.
   - Item 1
   - Item 2
   - Item 3
1. Second item.
   - Nested item 1
      - Further nested item 1
      - Further nested item 2
      - Further nested item 3
   - Nested item 2
   - Nested item 3

---

# Portal Economiario - Trocar Perfil Usuario

*** Trocar o Perfil do Economiario/Usuario ***

/api/administracao/usuario/atualizar
{
    "marcadorControle": "{{marcadorControle}}",
    "agenciaVinculada": 0,
    "tipoPerfil": "ECONOMIARIO",
    "nomeAcesso": "TER01763"
}

* ADMINISTRADOR
* MEDICO
* ANALISTAPRODUTO
* OPERADOR
* ECONOMIARIO

curl --location 'http://localhost:62056//api/administracao/usuario/atualizar/bloqueioativacao' \
--header 'Content-Type: application/json' \
--header 'Accept: text/plain' \
--data '{
  "marcadorControle": "<string>",
  "nomeAcesso": "<string>",
  "bloqueado": "<boolean>",
  "desativado": "<boolean>"
}'

---

# Powershell - Listar portas

Listar tudo que esta usando a porta 80
netstat -a -o -n | findstr  0:80

Listar tudo que esta usando o IP
netstat -a -o -n | findstr  192.168.128.166

---

# PowerShell - Listar todos os arquivos que comecem por *.Proxy

PowerShell - Listar todos os arquivos que comecem por *.Proxy.cs dentro de um diretório específico

Get-ChildItem -Path C:\ -Filter .npmrc -Recurse -ErrorAction SilentlyContinue -Force | % { $_.fullname } | where fullname -notmatch 'Entrada' | where fullname -notmatch 'Retorno'

---

# SQL - Query Quantidade de emissões de IR

USE PEDB00
GO
DECLARE @DataInicio AS DATETIME = CONVERT(DATETIME,'2026-01-24',120);
DECLARE @Dias INT = 7;

WITH base AS (
    SELECT
        NUM_CERTIFICADO_BILHETE,
        (DATEDIFF(DAY,@DataInicio,DTH_CRIACAO) / @Dias) + 1 AS num_semana,
        DATEADD(DAY,(DATEDIFF(DAY,@DataInicio,DTH_CRIACAO) / @Dias) * @Dias,@DataInicio) AS inicio_semana
    FROM SHDB00.POS.SH_012_SEGUNDA_FORMA_PAGAMENTO_VIDA
    WHERE DTH_CRIACAO >= @DataInicio
),
semanas AS (
    SELECT
        inicio_semana,
        'Semana ' + CAST(num_semana AS VARCHAR(3)) + ' - ' +
        FORMAT(inicio_semana,'dd/MM/yy') + '-' +
        FORMAT(DATEADD(DAY,@Dias-1,inicio_semana),'dd/MM/yy') AS semana,
        COUNT(DISTINCT NUM_CERTIFICADO_BILHETE) AS total_semana
    FROM base
    GROUP BY num_semana, inicio_semana
)
SELECT
    semana,
    total_semana,
    SUM(total_semana) OVER (ORDER BY inicio_semana) AS acumulado_bruto
FROM semanas
ORDER BY inicio_semana;

---

# GI - Busca e análise de dados em tempo real

Elastic - http://100.70.56.17:5601/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:60000),time:(from:now-1y%2Fd,to:now))&_a=(columns:!(),dataSource:(dataViewId:'180ab758-ab69-4da3-b15e-1afbe5377c6d',type:dataView),filters:!(),interval:auto,query:(language:kuery,query:''),sort:!(!('@timestamp',desc)))

Grafana - http://100.70.56.9:3000/d/f5-integracao-apis/9d90584?orgId=1&from=now-24h&to=now&timezone=America%2FSao_Paulo

usuario / senha - Cvp14950 / Cvp@2026

---

# Configurar mais de uma Versão do Node.js

# Como Configurar Mais de uma Versão do Node.js
Ao trabalhar com múltiplos projetos ReactJS, pode ser necessário utilizar versões diferentes do Node.js para evitar problemas de compatibilidade. Para usar uma versão específica sem alterar a versão global do Node.js, siga os passos abaixo:

## 1. Baixar e Instalar a Versão desejada do Node.js:
Acesse o site oficial do Node.js e selecione a versão desejada.
Faça o download da versão Standalone Binary (.zip).
![undefined.jpg](/.attachments/undefined-603ea6c1-eb76-490b-9726-a2d3577ab42c.jpg)
Descompacte a pasta em um diretório de sua escolha.
## 2. Configurar o Caminho (PATH) para a Versão Alternativa no Bash
Acesse o diretório do seu usuário:
C:\Users\SEU_USUARIO

Crie (ou edite, caso já existam) os arquivos .bash_profile e .bashrc dentro dessa pasta.

Adicione o seguinte conteúdo aos arquivos:

- bash_profile:
`test -f ~/.profile && . ~/.profile `
`test -f ~/.bashrc && . ~/.bashrc`


- bashrc:
`export NODE_PATH="/c/Users/SEU_USUARIO/Caminho/Para/nodejs"`
`export PATH=$NODE_PATH:$PATH`



⚠️ **Substitua /c/Users/SEU_USUARIO/Caminho/Para/nodejs pelo caminho real onde você descompactou o Node.js.**

## 3. Testar a Configuração
Salve os arquivos e abra um novo terminal Bash.
Rode o comando:
`node -v`
Isso deve exibir a versão do Node.js que foi carregada a partir do diretório especificado.

## Como Funciona?
O arquivo .bashrc adiciona o caminho da versão alternativa do Node.js ao PATH sempre que um terminal Bash é aberto.
Para alternar versões, basta alterar o valor de NODE_PATH no arquivo .bashrc.
Se precisar voltar para a versão global do Node.js, basta abrir um terminal diferente (PowerShell ou CMD) ou remover as variáveis do arquivo .bashrc.

## Importante!
✅ Sempre use o terminal Bash para carregar a versão alternativa do Node.js.
✅ Para usar a versão global, utilize outro terminal ou remova as configurações do .bashrc.

📺 [Vídeo explicativo em caso de dúvidas](/.attachments/Chamada%20com%20Isabelly%20e%202%20outras%20pessoas-20250224_104552-Gravação%20de%20Reunião-93cf752b-b039-46f0-a074-a9d35714f577.mp4)

---

# Azuredevopslabs

Para quem quer aprender um pouco mais sobre Azure DevOps, segue o Hands-On
https://www.azuredevopslabs.com/

---

# ObterTokenInfo - GI

curl --location 'https://integracao.caixavidaeprevidencia.com.br/api/Autenticar/ObterTokenInfo' \
--header 'accept: application/json, text/plain, */*' \
--header 'accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6,la;q=0.5' \
--header 'content-type: application/json' \
--header 'dnt: 1' \
--header 'origin: https://portaleconomiario.caixavidaeprevidencia.com.br' \
--header 'priority: u=1, i' \
--header 'referer: https://portaleconomiario.caixavidaeprevidencia.com.br/' \
--header 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
--header 'sec-ch-ua-mobile: ?0' \
--header 'sec-ch-ua-platform: "Windows"' \
--header 'sec-fetch-dest: empty' \
--header 'sec-fetch-mode: cors' \
--header 'sec-fetch-site: same-site' \
--header 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
--data '{"cpf":"CVP13486","funcao":"PECO_ConsultarMatrizAcessoPrevidencia"}'

---
