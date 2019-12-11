<template>
  <section id="header-wrapper">
    <header id="header">
      <div class="header-wrapper">
        <div class="title">
          <NavLink
            link="/"
            class="home-link bordered-box"
          >{{ $site.title }}
          </NavLink>
        </div>
        <div class="header-right-wrap">
          <ul
            class="nav"
            v-if="$themeConfig.nav"
          >
            <li
              class="nav-item"
              v-for="item in $themeConfig.nav"
            >
              <NavLink :link="item.link">{{ item.text }}</NavLink>
            </li>
          </ul>
          <SearchBox />
        </div>
      </div>
    </header>
  </section>
</template>

<script>
import SearchBox from '@SearchBox'

export default {
  components: { SearchBox },
}
</script>

<style lang="stylus">
@import '~@app/style/config';

#header {
  z-index: 12;
  position: fixed;
  top: 0;
  width: 100vw;
  box-sizing: border-box;
  // background lighten(#3eaf7c, 90%)
  background-color: #FFF;
  padding: 20px 32px 20px;
  margin: auto;

  transition: all 1s cubic-bezier(0.25, 0.8, 0.25, 1);

  ol, ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

}

// border-bottom 5px solid lighten(#3eaf7c, 50%)
.header-wrapper {
  display: flex;
  line-height: 40px;
  height: 40px;

  .title {
    /* flex 0 0 200px */
    color: #000;
    font-size: 30px;
    margin: 0;
    letter-spacing: 2px;
    display: block;
    text-transform: uppercase;

    a {
      color: #000;
      font-weight: bold;
      font-family: Serif;
      text-decoration: none;
    }
  }

  .header-right-wrap {
    flex: 1;
    display: flex;
    justify-content: flex-end;

    .nav {
      flex: 0 0 auto;
      display: flex;
      margin: 0;
      align-items: end;

      .nav-item {
        margin-left: 20px;

        a {
          font-family: Serif;
          font-size: 20px;
          text-underline-position: under;
          transition: all 0.3s;
        }
      }
    }

    .search-box {
      font-family: Serif;
      margin-left: 20px;

      input {
        border-radius: 0;
        transition: all 0.5s;
        border: 2px solid #cecece;

        &:hover {
          border: 2px solid $accentColor;
        }
      }

      .suggestions {
        border: 1px solid #000;
        border-radius: 0;
        top: 40px;
        right: 0;

        a {
          color: #000;
          text-decoration: none;

          &.focused {
            color: $accentColor;
          }
        }
      }
    }
  }
}

@media (max-width: $MQMobile) {
  #header {
    display: none;
  }

  .header-wrapper {
    flex-direction: column;

    .header-right-wrap {
      display: none;
    }
  }
}
</style>
