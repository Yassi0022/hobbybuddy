import re

def main():
    with open('src/main/resources/static/js/hobbybuddy.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Emojis regex
    emoji_pattern = re.compile(
        r'['
        r'\U0001f600-\U0001f64f'  # emoticons
        r'\U0001f300-\U0001f5ff'  # symbols & pictographs
        r'\U0001f680-\U0001f6ff'  # transport & map symbols
        r'\U0001f700-\U0001f77f'  # alchemical symbols
        r'\U0001f780-\U0001f7ff'  # Geometric Shapes Extended
        r'\U0001f800-\U0001f8ff'  # Supplemental Arrows-C
        r'\U0001f900-\U0001f9ff'  # Supplemental Symbols and Pictographs
        r'\U0001fa00-\U0001fa6f'  # Chess Symbols
        r'\U0001fa70-\U0001faff'  # Symbols and Pictographs Extended-A
        r'\u2600-\u26ff'          # misc symbols
        r'\u2700-\u27bf'          # dingbats
        r']+', flags=re.UNICODE)

    content = emoji_pattern.sub('', content)

    # Remove extra spaces before quotes
    content = re.compile(r' \'', flags=re.UNICODE).sub('\'', content)

    with open('src/main/resources/static/js/hobbybuddy.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Removed emojis from JS")

if __name__ == "__main__":
    main()
